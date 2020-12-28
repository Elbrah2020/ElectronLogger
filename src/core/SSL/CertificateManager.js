const Shell = require('node-powershell');
const isElevated = require('is-elevated');
const fs = require('fs');

class CertificateManager {
	static async isCertTrusted(fingerprint) {
		try {
			const ps = new Shell({executionPolicy: 'Bypass', verbose: false});
			ps.addCommand('Get-ChildItem Cert:\\LocalMachine\\Root\\' + fingerprint);

			let result = (await ps.invoke()).includes('CN=Elbrah Corp');
			await ps.dispose();

			return result;
		} catch {
			return false;
		}
	}

	static async installCertificate(certificatePath) {
		if (await isElevated()) {
			try {
				fs.writeFileSync('./ca.crt', fs.readFileSync(certificatePath));
				const ps = new Shell({executionPolicy: 'Bypass', verbose: false});
				ps.addCommand('Import-Certificate -FilePath ./ca.crt -CertStoreLocation \'Cert:\\LocalMachine\\Root\'');

				let result = (await ps.invoke()).includes('CN=Elbrah Corp');
				await ps.dispose();

				fs.unlinkSync('./ca.crt');

				return result;	
			} catch {
				return false;
			}
		} else {
			alert('Please run me as admin to install certificate, program will shutdown now.');
			require('electron').remote.getCurrentWindow().close();
		}
	}

	static async uninstallCertificate(fingerprint) {
		if (await CertificateManager.isCertTrusted(fingerprint)) {
			if (await isElevated()) {
				try {
					const ps = new Shell({executionPolicy: 'Bypass', verbose: false});
					ps.addCommand('Get-ChildItem Cert:\\LocalMachine\\Root\\' + fingerprint + ' | Remove-Item');

					let result = await ps.invoke();
					await ps.dispose();

					return result;
				} catch {
					return false;
				}
			} else {
				alert('Please run me as admin to uninstall certificate, program will shutdown now.');
				require('electron').remote.getCurrentWindow().close();
			}
		} else {
			return false;
		}
	}
}

module.exports = CertificateManager;