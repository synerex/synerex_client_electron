const ipc = require('electron').ipcRenderer;

const Terminal = require('terminal.js');


let nodeTerm = null;
let sxTerm = null;
let nodeTermP, sxTermP;

ipc.on('started', function(){
    console.log("Started!")
    nodeTermP = document.getElementById('nodeterm')
    console.log('node:',nodeTermP)
    nodeTerm = new Terminal({columns:80,rows:200})
    nodeTerm.state.setMode('crlf', true);
    nodeTerm.dom(nodeTermP)
    nodeTerm.write("")
//    cs.appendChild(nodeTerm.html)

    sxTerm = new Terminal({columns:80,rows:200})
    sxTerm.state.setMode('crlf', true);
    sxTermP = document.getElementById('sxterm')
    console.log("sx",sxTermP)
    sxTerm.dom(sxTermP)
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
    nodeTermP.scrollTo({
        top: (nodeTerm.state.cursor.y-10) * 14.5,
        left: 0,
        behavior: 'smooth'
    } )
    console.log('Got:'+data, 'scrooll'+ nodeTerm.state.cursor.y*10)

})
ipc.on('sxlog', function(event, data){
    sxTerm.write(data)
    sxTermP.scrollTo({
        top: (sxTerm.state.cursor.y-10) * 14.5,
        left: 0,
        behavior: 'smooth'
    } )
    console.log('Got:'+data)
    console.log('SXscrooll'+ sxTerm.state.cursor.y*10)
})

