const { shell } = require('electron');

window.onload = () => {
	$('#externalGithubButton').click(() => {
		shell.openExternal('https://github.com/Elbrah2020/ElectronLogger');
	});
}