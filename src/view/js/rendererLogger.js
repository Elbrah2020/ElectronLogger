const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('incomingMessage', (event, message, header, packetName) => {
	let append = '<span class="red">Incoming[</span>';
	if (packetName) {
		append += '<span class="cyan">' + packetName + '</span>&nbsp;<span class="gray">/</span>&nbsp;';
	}
	append += '<span class="green">' + header + '</span><span class="red">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + message + '</span><br/>';
	$('#console').append(append);
	scrollToBottom();
});

ipcRenderer.on('outgoingMessage', (event, message, header, packetName) => {
	let append = '<span class="blue">Outgoing[</span>';
	if (packetName) {
		append += '<span class="cyan">' + packetName + '</span>&nbsp;<span class="gray">/</span>&nbsp;';
	}
	append += '<span class="green">' + header + '</span><span class="blue">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + message + '</span><br/>';
	$('#console').append(append);
	scrollToBottom();
});

function scrollToBottom() {
	var consoleElem = document.getElementById('console');
  consoleElem.scrollTop = consoleElem.scrollHeight;
}