const container = document.getElementById('container')
// const criar = document.getElementById('criar')
const range = document.getElementById('range')
const numRange = document.getElementById('numRange')
const pincel = document.getElementById('pincel')
const borracha = document.getElementById('borracha')
const balde = document.getElementById('balde')
const gotas = document.getElementById('gotas')
const corA = document.getElementById('corA')
const corB = document.getElementById('corB')

numRange.textContent = range.value

let canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d', {
    alpha: true,
    willReadFrequently: true,
})

// canvas.style.backgroundColor = 'black'

ctx.imageSmoothingEnabled = false
ctx.imageSmoothingQuality = "low"

let lineStart = [0,0]
let lineStroke = [0,0,0,255]

// canvas.width = 100
// canvas.height = 100 

function resize() {
    const rect = container.getBoundingClientRect()
    const saved = ctx.getImageData(0,0,canvas.width,canvas.height)
    canvas.width  = rect.width
    canvas.height = rect.height
    ctx.fillStyle = corB.value
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.putImageData(saved,0,0)
}
resize()


ctx.fillStyle = corB.value
ctx.fillRect(0,0,canvas.width,canvas.height)

const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(container)



container.appendChild(canvas)

let pressed = false
let size = 2;

function colorMatches(c1,c2){
    return ((Math.abs(c1[0]-c2[0])+
           Math.abs(c1[1]-c2[1])+
           Math.abs(c1[2]-c2[2])+
           Math.abs(c1[3]-c2[3]))/4)<3;
}
/**
 * 
 * @param {string} hex 
 */
function hexToRgba(hex){
    const r = hex.substring(1,3)
    const g = hex.substring(3,5)
    const b = hex.substring(5,7)
    return [parseInt(r,16),parseInt(g,16),parseInt(b,16),255]
}

function rgbaToHex(r, g, b) {
  return (
    "#" + [r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("")
  )
}

function moveTo(x,y){
    lineStart = [x,y]
}

function lineTo(x2, y2, thickness = 1) {
    let [x1, y1] = lineStart

    let dx = x2 - x1
    let dy = y2 - y1

    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    if (steps === 0) return

    const xInc = dx / steps
    const yInc = dy / steps

    const r = Math.floor(thickness / 2)

    // bounding box
    const minX = Math.floor(Math.min(x1, x2) - r)
    const minY = Math.floor(Math.min(y1, y2) - r)
    const maxX = Math.ceil(Math.max(x1, x2) + r)
    const maxY = Math.ceil(Math.max(y1, y2) + r)

    const sx = Math.max(0, minX)
    const sy = Math.max(0, minY)
    const ex = Math.min(canvas.width,  maxX)
    const ey = Math.min(canvas.height, maxY)

    const sw = Math.max(size+1,ex - sx)
    const sh = Math.max(size+1,ey - sy)

    const image = ctx.getImageData(sx, sy, sw, sh)
    const w = image.width
    const c = 4

    let x = x1
    let y = y1

    for (let i = 0; i <= steps; i++) {
        const cx = Math.round(x)
        const cy = Math.round(y)

        for (let ox = -r; ox <= r; ox++) {
            for (let oy = -r; oy <= r; oy++) {
                if (ox*ox + oy*oy > r*r) continue

                const px = cx + ox
                const py = cy + oy

                // converter para coordenadas locais
                const lx = px - sx
                const ly = py - sy

                if (lx < 0 || ly < 0 || lx >= sw || ly >= sh)
                    continue

                const index = (ly * w + lx) * c
                image.data[index]     = lineStroke[0]
                image.data[index + 1] = lineStroke[1]
                image.data[index + 2] = lineStroke[2]
                image.data[index + 3] = lineStroke[3]
            }
        }

        x += xInc
        y += yInc
    }

    ctx.putImageData(image, sx, sy)
    lineStart = [x2, y2]
}


function fill(x,y,tint){
    const rect = canvas.getBoundingClientRect()
    const image = ctx.getImageData(0,0,canvas.width,canvas.height)    
    let elements = [[x,y]]
    const w = image.width
    const h = image.height
    const c = 4
    let index = (w*y*c)+(x*c);
    let color = image.data.slice(index,index+c)
    let max = (w*h)*4
    while (elements.length>0 && max-->0){
        let atual = elements.pop()
        if (!atual) continue;
        
        if ((atual[0]<0 || atual[0]>image.width) ||
        (atual[1]<0 || atual[1]>image.height)) continue;
        
        let indexAtual = (w*atual[1]*c)+(atual[0]*c)
        let corAtual = image.data.slice(indexAtual,indexAtual+c)
        const vizinhos = [
            [atual[0],atual[1]-1],
            [atual[0],atual[1]+1],
            [atual[0]-1,atual[1]],
            [atual[0]+1,atual[1]],
        ]
        for (const [vx,vy] of vizinhos) {
            let indexV = (w*vy*c)+(vx*c)
            if (indexV<0 || indexV >= image.data.length) continue
            let corV = image.data.slice(indexV,indexV+c)
            if (colorMatches(corV, color)){
                elements.push([vx,vy])
            }        
        }

        if (colorMatches(corAtual, color)){
            image.data[indexAtual]=tint[0]
            image.data[indexAtual+1]=tint[1]
            image.data[indexAtual+2]=tint[2]
            image.data[indexAtual+3]=tint[3]
        }
    }
    ctx.putImageData(image,0,0)
}

function canvasRelative(clientX,clientY){
    const canvasRect = canvas.getBoundingClientRect()
    const sx = canvasRect.width / canvas.width;
    const sy = canvasRect.height / canvas.height;
    const x = Math.max(0,Math.round((clientX - canvasRect.x)/sx));
    const y = Math.max(0,Math.round((clientY - canvasRect.y)/sy));
    return [x,y]
}

canvas.addEventListener('pointerdown', (e)=>{
    const [mx,my] = canvasRelative(e.clientX,e.clientY)

    if (balde.checked){
        fill(mx,my,hexToRgba(corA.value))
    }else if (pincel.checked || borracha.checked){
        if (e.button!=0) return;
        pressed = true  
        const rect = canvas.getBoundingClientRect()
        // ctx.beginPath()
        moveTo(mx, my)
        // ctx.lineWidth = size
        // ctx.lineCap = "round"
        // ctx.lineJoin = "round"
        // ctx.strokeStyle = cor.value
        if (borracha.checked){
            lineStroke = hexToRgba(corB.value)
        }else {
            lineStroke = hexToRgba(corA.value)
        }
        lineTo(mx, my, size)
        // ctx.stroke()
    }
})

canvas.addEventListener('pointerup', (e)=>{
    if (!gotas.checked) return

    e.preventDefault()
    e.stopPropagation()

    const [mx, my] = canvasRelative(e.clientX, e.clientY)

    const image = ctx.getImageData(mx, my, 1, 1)

    corA.value = rgbaToHex(
        image.data[0],
        image.data[1],
        image.data[2]
    )
})

document.addEventListener('pointerup', (e) => {
    pressed = false
    if (balde.checked) return
    
})


canvas.addEventListener('pointermove', (e)=>{
    if (balde.checked){

    }else if (pincel.checked || borracha.checked){
        if (!pressed) {return};
        const rect = canvas.getBoundingClientRect()
        const [mx,my] = canvasRelative(e.clientX,e.clientY)
        if (borracha.checked){
            lineStroke = hexToRgba(corB.value)
        }else{
            lineStroke = hexToRgba(corA.value)
        }
        lineTo(mx, my, size)
        ctx.stroke()
    }
})

range.addEventListener('input',(e)=>{
    numRange.textContent = Math.max(range.value,1)
    size = numRange.textContent
})
