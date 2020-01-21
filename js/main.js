const ipc = require('electron').ipcRenderer;

const Terminal = require('terminal.js');


let nodeTerm = null;
let sxTerm = null;
let nodeTermP =null;
let  sxTermP = null;

ipc.on('started', function(){
    console.log("Started!")
    nodeTermP = document.getElementById('nodeterm')
    console.log('node:',nodeTermP)
    nodeTerm = new Terminal({columns:100,rows:200})
    nodeTerm.state.setMode('crlf', true);
    nodeTerm.dom(nodeTermP)
    nodeTerm.write("")
//    cs.appendChild(nodeTerm.html)

    sxTerm = new Terminal({columns:100,rows:200})
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
        top: (nodeTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
//    console.log('Got:'+data, 'scrooll'+ nodeTerm.state.cursor.y*10)

})
ipc.on('sxlog', function(event, data){
    sxTerm.write(data)
    sxTermP.scrollTo({
        top: (sxTerm.state.cursor.y-10) * 15,
        left: 0,
        behavior: 'smooth'
    } )
 //   console.log('Got:'+data)
 //   console.log('SXscrooll'+ sxTerm.state.cursor.y*10)
})


// resize!
function resize() { 
    if (nodeTermP != null) {
        nodeTermP.style.height = Math.round(window.innerHeight*0.45)+"px";
        console.log("Set", nodeTermP.style)
    }
    if (sxTermP != null) {
        sxTermP.style.height = Math.round(window.innerHeight*0.45)+"px";
        console.log("SetSx", sxTermP.style)
    }
}

window.onresize = resize;
