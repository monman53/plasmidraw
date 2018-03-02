Vue.component('gene-item', { 
    template: `
                <g
                    v-if="gene.f_visible"
                    >
                    <path 
                        @mousedown="mouseDown('all')"
                        :d="d"
                        :fill="gene.color"
                        stroke="black"
                        :stroke-width="stroke_width"
                        class="gene-item"
                    />
                    <g v-if="f_knob_visible">
                        <text
                            :x="mx*(1-gene.style.dr-0.04)"
                            :y="my*(1-gene.style.dr-0.04)"
                            :transform="text_rotate"
                            :text-anchor="text_anchor"
                            font-size='0.1'>
                            {{gene.name}}
                        </text>
                        <circle
                            :cx="sx*(1-gene.style.dr)"
                            :cy="sy*(1-gene.style.dr)"
                            r="0.04"
                            class="knob"
                            @mousedown="mouseDown('dr')"
                        />
                        <circle v-if="gene.f_arrow"
                            :cx="ax*(1+gene.style.dr+gene.style.warrow)"
                            :cy="ay*(1+gene.style.dr+gene.style.warrow)"
                            r="0.04"
                            class="knob"
                            @mousedown="mouseDown('a')"
                        />
                        <circle
                            :cx="tx"
                            :cy="ty"
                            r="0.04"
                            @mousedown="mouseDown('to')"
                            class="knob"
                        />
                    </g>
                </g>`,
    props: ['gene', 'editing_gene', 'mouse'], 
    data: function() {
        return {
        };
    },
    methods: {
        mouseDown: function(which) {
            this.gene.offset = this.mouse.pos;
            this.$emit('edit-gene', this.gene.key, which);
        }, 
        debug: function() {
            var d = new Date();
            console.log(d.getTime());
        },
    }, 
    computed: {
        stroke_width: function() {
            return this.gene.style.f_stroke ? 0.01 : 0;
        },
        f_knob_visible: function() {
            if(this.editing_gene === null) return false;
            return this.gene.f_visible && (this.gene.key == this.editing_gene.key);
        },
        sx: function() {
            return  this.gene.style.r*Math.sin(this.gene.from*2*Math.PI);
        },
        sy: function() {
            return -this.gene.style.r*Math.cos(this.gene.from*2*Math.PI);
        },
        middle: function() {
            return (this.gene.from+this.gene.to)/2;
        },
        mx: function() {
            return  this.gene.style.r*Math.sin(this.middle*2*Math.PI);
        },
        ax: function() {
            var darrow = Math.min(Math.abs(this.gene.from-this.gene.to), this.gene.style.darrow);
            return  this.gene.style.r*Math.sin((this.gene.to+(this.gene.to > this.gene.from ? -darrow : darrow))*2*Math.PI);
        },
        ay: function() {
            var darrow = Math.min(Math.abs(this.gene.from-this.gene.to), this.gene.style.darrow);
            return -this.gene.style.r*Math.cos((this.gene.to+(this.gene.to > this.gene.from ? -darrow : darrow))*2*Math.PI);
        },
        my: function() {
            return -this.gene.style.r*Math.cos(this.middle*2*Math.PI);
        },
        tx: function() {
            return  this.gene.style.r*Math.sin(this.gene.to*2*Math.PI);
        },
        ty: function() {
            return -this.gene.style.r*Math.cos(this.gene.to*2*Math.PI);
        },
        text_rotate: function(){
            return `rotate(${(this.middle < 0.5 ? -90 : 90)+360*this.middle} 
                            ${this.mx*(1-this.gene.style.dr-0.04)}
                            ${this.my*(1-this.gene.style.dr-0.04)})`;
        },
        text_anchor: function() {
            return this.middle < 0.5 ? 'end' : 'start';
        },
        d: function() {
            var r    = this.gene.style.r;
            var from = this.gene.from;
            var to   = this.gene.to;

            var darrow = Math.min(Math.abs(from-to), this.gene.style.darrow);

            var dr = Math.min(this.gene.style.dr, 1);
            var wr = Math.min(this.gene.style.warrow, 2);

            var sx = this.sx;
            var sy = this.sy;
            var ax = this.ax;
            var ay = this.ay;
            var tx = this.tx;
            var ty = this.ty;

            var a = from <= to ? 1 : 0;
            var b = Math.abs(from-to) >= 0.5+darrow ? 1 : 0;

            var res;
            if(this.gene.f_arrow){
                res = 
                    `m ${sx*(1+dr)} ${sy*(1+dr)}
                     A ${r*(1+dr)} ${r*(1+dr)}, 0 ${b} ${a}, ${ax*(1+dr)} ${ay*(1+dr)}
                     L ${ax*(1+dr+wr)} ${ay*(1+dr+wr)}
                     L ${tx} ${ty}
                     L ${ax*(1-dr-wr)} ${ay*(1-dr-wr)}
                     L ${ax*(1-dr)} ${ay*(1-dr)}
                     A ${r*(1-dr)} ${r*(1-dr)}, 0 ${b} ${1-a}, ${sx*(1-dr)} ${sy*(1-dr)}
                     Z`;
            }else{
                res =
                    `m ${sx*(1+dr)} ${sy*(1+dr)}
                     A ${r*(1+dr)} ${r*(1+dr)}, 0 ${b} ${a}, ${tx*(1+dr)} ${ty*(1+dr)}
                     L ${tx*(1-dr)} ${ty*(1-dr)}
                     A ${r*(1-dr)} ${r*(1-dr)}, 0 ${b} ${1-a}, ${sx*(1-dr)} ${sy*(1-dr)}
                     Z`;
            }
            return res;
        },
    },
});

var plasmid = new Vue({
    el: "#plasmid", 
    data: {
        genes: [],
        key_counter: 0,
        g_style: {
            r: 1.0,
            dr: 0.08,
            darrow: 0.01,
            warrow: 0,
            f_stroke: true,
        },
        gene: null,
        mouse: {
            state: '',
            drag: false,
            pos: null,
            r: null,
            x: null,
            y: null,
            cx: null,
            cy: null,
        },
        which: null,
        offset: 0,
        svg_size: 900,
    },
    watch: {
        mouse: {
            handler: function() {
                this.mouse.pos = (Math.atan2(-this.mouse.x, this.mouse.y) + Math.PI)/(2*Math.PI);
                this.mouse.cx =  Math.sin(this.mouse.pos*2*Math.PI);
                this.mouse.cy = -Math.cos(this.mouse.pos*2*Math.PI);
                this.mouse.r  = Math.sqrt(this.mouse.x*this.mouse.x + this.mouse.y*this.mouse.y);
            },
            deep: true,
        },
    },
    methods: {
        addGene: function(event, from = 0) {
            var new_gene = {
                key: this.key_counter++,
                name: "gene_" + this.key_counter,
                from: from,
                to: Math.min(from+0.1, 1.0),
                color: "#9FCDFF",
                f_arrow: true,
                f_visible: true,
                style_id: 0,
                style: this.g_style,
                custom_style: {},
            }
            Object.assign(new_gene.custom_style, this.g_style);

            this.genes.push(new_gene);
            this.gene = new_gene;
        },
        copyGene: function() {
            var copy_gene = Object.assign({}, this.gene);
            copy_gene.key = this.key_counter++;
            var min = Math.min(copy_gene.from, copy_gene.to);
            copy_gene.from -= min;
            copy_gene.to   -= min;
            this.genes.push(copy_gene);
            this.gene = copy_gene;
        },
        reverseGene: function() {
            var tmp = this.gene.from;
            this.gene.from = this.gene.to;
            this.gene.to   = tmp;
        },
        deleteGene: function() {
            this.gene.visible = false;
            for(var i=0;i<this.genes.length;i++){
                if(this.genes[i].key == this.gene.key){
                    this.genes.splice(i, 1);
                    this.gene = null;
                    break;
                }
            }
        },
        editGene: function(key, which) {
            for(var i=0;i<this.genes.length;i++){
                if(this.genes[i].key == key){
                    this.gene = this.genes[i];
                    break;
                }
            }
            this.which = which;
            this.offset = this.mouse.pos;
            this.mouse.drag = true;
        },
        mouseMove: function(event) {
            var svg = document.getElementById('plasmid-svg');
            var rect = svg.getBoundingClientRect();
            var x = (event.clientX - rect.left - rect.width/2)/(rect.width/4);
            var y = (event.clientY - rect.top  - rect.height/2)/(rect.height/4);
            this.mouse.x = x;
            this.mouse.y = y;

            if(!this.mouse.drag){
                return;
            }

            var offset = this.offset;
            var min = Math.min(this.gene.from, this.gene.to);
            var max = Math.max(this.gene.from, this.gene.to);
            this.$nextTick(function() {
                switch(this.which){
                    case 'all':
                        var d = 0;
                        if(max + this.mouse.pos-offset > 1){
                            d = 1 - max;
                        }else if(min + this.mouse.pos-offset < 0){
                            d = 0 - min;
                        }else{
                            d = this.mouse.pos-offset;
                        }
                        this.gene.from += d;
                        this.gene.to   += d;
                        this.offset = this.mouse.pos;
                        break;
                    case 'from':
                    case 'to':
                        this.gene[this.which] = this.mouse.pos;
                        break;
                    case 'dr':
                        this.gene.style.dr = Math.max(1-this.mouse.r, 0);
                        this.gene.from = this.mouse.pos;
                        break;
                    case 'a':
                        if(this.gene.to > this.gene.from){
                            this.gene.style.darrow = Math.min(Math.max(this.gene.to - this.mouse.pos, 0), this.gene.to-this.gene.from);
                        }else{
                            this.gene.style.darrow = Math.min(Math.max(this.mouse.pos - this.gene.to, 0), this.gene.from-this.gene.to);
                        }
                        this.gene.style.warrow = Math.max(this.mouse.r-1-this.gene.style.dr, 0);
                        break;
                }
            });
        },
        mouseUp: function() {
            this.mouse.drag = false;
        },
        mouseEnter: function() {
            this.mouse.state = 'onMainCircle';
        },
        mouseLeave: function() {
            this.mouse.state = '';
        },
        mouseDown: function() {
            this.addGene(null, this.mouse.pos);
        },
        exportSVG: function() {
            this.gene = null;
            Vue.nextTick(function() {
                var svgData = document.getElementById("plasmid-svg").outerHTML;
                var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
                var svgUrl = URL.createObjectURL(svgBlob);
                var downloadLink = document.createElement("a");
                downloadLink.href = svgUrl;
                downloadLink.download = "plasmid.svg";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
        },
        save: function() {
            this.gene = null;
            var save_json = {
                genes: this.genes,
                key_counter: this.key_counter,
                g_style: this.g_style, 
            };
            var jsonData = JSON.stringify(save_json);
            var jsonBlob = new Blob([jsonData], {type:"text/json;charset=utf-8"});
            var jsonUrl = URL.createObjectURL(jsonBlob);
            var downloadLink = document.createElement("a");
            downloadLink.href = jsonUrl;
            downloadLink.download = "plasmid.json";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        },
        load: function(event) {
            var reader = new FileReader();
            reader.readAsText(event.target.files[0]);
            console.log(this.genes);
            reader.onload = this.loadFile;
        },
        loadFile: function(event) {
            var data = JSON.parse(event.target.result);
            this.key_counter = data['key_counter'];
            this.genes = data['genes'];
            for(var key in data){
                this[key] = data[key];
            }
        },
    }, 
});
