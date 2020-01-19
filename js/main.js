const ipc = require('electron').ipcRenderer;

const Terminal = require('terminal.js');


let nodeTerm = null;
let sxTerm = null;

ipc.on('started', function(){
    console.log("Started!")
    var cs = document.getElementById('nodeterm')
    console.log('node:',cs)
    nodeTerm = new Terminal({columns:80,rows:200})
    nodeTerm.state.setMode('crlf', true);
    nodeTerm.dom(cs)
    nodeTerm.write("")
//    cs.appendChild(nodeTerm.html)

    sxTerm = new Terminal({columns:80,rows:200})
    sxTerm.state.setMode('crlf', true);
    cs = document.getElementById('sxterm')
    console.log("sx",cs)
    sxTerm.dom(cs)
    sxTerm.write("")
 //   cs.appendChild(sxTerm.html)

    document.getElementById('nodeserv').onclick = function() {
        // start NoderServer
        ipc.send('start-nodeserv','')
    }
    
    document.getElementById('sxserver').onclick = function() {
        // start NoderServer
        ipc.send('start-sxserver','')
    }
})


ipc.on('nodelog', function(event, data){
    nodeTerm.write(data)
    console.log('Got:'+data)
})
ipc.on('sxlog', function(event, data){
    sxTerm.write(data)
    console.log('Got:'+data)
})

