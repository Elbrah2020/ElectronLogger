const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('incomingMessage', (event, message, header) => {
	$('#console').append('<span class="red">Incoming[</span><span class="green">' + header + '</span><span class="red">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + message + '</span><br/>');
	scrollToBottom();
});

ipcRenderer.on('outgoingMessage', (event, message, header) => {
	$('#console').append('<span class="blue">Outgoing[</span><span class="green">' + header + '</span><span class="blue">]</span>&nbsp;<span class="gray">-></span>&nbsp;<span class="yellow">' + message + '</span><br/>');
	scrollToBottom();
});

function scrollToBottom() {
	var consoleElem = document.getElementById('console');
  consoleElem.scrollTop = consoleElem.scrollHeight;
}