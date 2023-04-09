globalThis.RUN = new class {

    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = canvas.getContext('2d');
        this.button = document.getElementById('Generate-button');
        this.inputs = {
            x: document.getElementById('dimX'),
            y: document.getElementById('dimY'),
            s: document.getElementById('scal'),
            z: document.getElementById('zoom'),
            q: document.getElementById('speed'),
            c: document.getElementById('colored'),
            m: document.getElementById('mode'),
            slow: document.getElementById('slow'),
            fV: document.getElementById('functionV')
        }
    }

    async runScript() {
        this.button.title = ""
        const X = this.canvas.width / 2//this.inputs.x.value
        const Y = 256//this.inputs.y.value
        const colored = this.inputs.c.checked
        const slow = this.inputs.slow.checked
        const ZOOM = this.inputs.z.value
        const SPEED = this.inputs.q.value
        let func = null;
        let getVal = null;
        let done = false;
        switch (this.inputs.m.value) {
            case 'N': getVal = (x) => (x); break;
            case 'S': getVal = (x) => (x + 128); break;
            case 'F': getVal = (x) => (Math.max(-1, Math.min(1, x))) * 127.5 + 128; break;

            default: getVal = (x) => (NaN); break;
        }
        // Easy math functions
        const params = Object.getOwnPropertyNames(Math);
        const values = params.map(k => Math[k]);
        params.push('int', 'window');
        values.push(Math.floor, globalThis);
        //Compiling
        try {
            func = new Function(...params, 't,x,y', `return 0,\n${this.inputs.fV.value || 0};`)
                .bind(globalThis, ...values);
            func(0)
            done = func
        } catch (err) {
            this.button.innerText = "In compilation: " + err.message
            this.button.title = err.stack
        }
        if (done) {
            window.location.hash = encodeURIComponent(btoa(JSON.stringify({ code: this.inputs.fV.value, mode: this.inputs.m.value })))
            try {
                for (let xP = 0; xP < X * this.inputs.s.value / ZOOM; xP++) {
                    for (let yP = 0; yP < Y; yP++) {
                        const y = Math.floor(yP / Y * 256)
                        const x = Math.floor(xP / X * X / ZOOM)
                        const t = (x << 8) + y

                        let V = func(t, x, y); // Value // NaN

                        // Convert brightness to grayscale color
                        let color

                        if (Array.isArray(V) && !colored) {
                            V = [getVal(V[0]), getVal(V[1])]
                            const N1 = isNaN(V[0]) ? 100 : 0;
                            const N2 = isNaN(V[1]) ? 100 : 0;
                            color = `rgb(${N2 | N1 ? N2 | N1 : V[1] & 255},${N1 ? N1 : V[0] & 255},${N2 ? 0 : V[1] & 255})`
                        } else if (Array.isArray(V) && colored) {
                            V = getVal(V[0])
                            const N = isNaN(V) ? 100 : 0;
                            color = `rgb(${N ? 100 : (!colored ? V & 255 : V >> 16 & 255)}, ${N ? 0 : (!colored ? V & 255 : V >> 0 & 255)}, ${N ? 0 : (!colored ? V & 255 : V >> 8 & 255)})`;
                        } else {
                            V = getVal(V)
                            const N = isNaN(V) ? 100 : 0;
                            color = `rgb(${N ? 100 : (!colored ? V & 255 : V >> 16 & 255)}, ${N ? 0 : (!colored ? V & 255 : V >> 0 & 255)}, ${N ? 0 : (!colored ? V & 255 : V >> 8 & 255)})`;
                        }
                        // Draw pixel on the canvas
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(xP * Math.ceil(this.canvas.width / X * SPEED) % 1024, yP * Math.ceil(this.canvas.height / Y), Math.ceil(this.canvas.width / X * SPEED) % 1024, Math.ceil(this.canvas.height / Y));
                    }
                    if (slow) {
                        this.button.innerText = (xP + "/" + (X * this.inputs.s.value))
                        await new Promise(resolve => { setTimeout(resolve, 2) })
                    }
                }
                this.button.innerText = "Generate Another"
            } catch (err) { this.button.innerText = err.message; this.button.title = err.stack }
        }
    }
}

let hash = window.location.hash

if (hash) {
    try {
        const data = JSON.parse(atob(decodeURIComponent(hash.slice(1))))
        console.log(data)
        RUN.inputs.fV.value = data.code
        RUN.inputs.m.value = data.mode
    } catch (error) {
        console.error(`CODELOADERROR: ${error.message}`)
    }
}

window.onresize = RUN.inputs.s.onchange = () => {
    const WIDE = window.innerWidth
    console.log(String(WIDE) + String(WIDE < 1056))
    if (WIDE < 1056) {
        RUN.canvas.width = 512;
    } else {
        RUN.canvas.width = 1024;
    }
}