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
                            :x="text_x"
                            :y="text_y"
                            :transform="text_rotate"
                            :text-anchor="text_anchor"
                            font-size='0.1'>
                            {{gene.name}}
                        </text>
                        <circle
                            :cx="sx"
                            :cy="sy"
                            r="0.04"
                            @mousedown="mouseDown('from')"
                            class="knob"
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
    props: ['gene', 'editing_gene', 'g_style', 'mouse_pos'], 
    data: function() {
        return {
        };
    },
    methods: {
        mouseDown: function(which) {
            this.gene.offset = this.mouse_pos;
            this.$emit('edit-gene', this.gene.key, which);
        }, 
        debug: function() {
            var d = new Date();
            console.log(d.getTime());
        },
    }, 
    computed: {
        style: function() {
            if(this.gene.style_id === null){
                return this.gene.style;
            }else{
                return this.g_style;
            }
        }, 
        stroke_width: function() {
            return this.style.f_stroke ? 0.01 : 0;
        },
        f_knob_visible: function() {
            if(this.editing_gene === null) return false;
            return this.gene.f_visible && (this.gene.key == this.editing_gene.key);
        },
        sx: function() {
            return  this.gene.r*Math.sin(this.gene.from*2*Math.PI);
        },
        sy: function() {
            return -this.gene.r*Math.cos(this.gene.from*2*Math.PI);
        },
        tx: function() {
            return  this.gene.r*Math.sin(this.gene.to*2*Math.PI);
        },
        ty: function() {
            return -this.gene.r*Math.cos(this.gene.to*2*Math.PI);
        },
        text_m: function() {
            return (this.gene.from+this.gene.to)/2;
        },
        text_x: function() {
            return this.gene.r*Math.sin(this.text_m*2*Math.PI)*(1-this.style.dr);
        },
        text_y: function() {
            return -this.gene.r*Math.cos(this.text_m*2*Math.PI)*(1-this.style.dr);
        },
        text_rotate: function(){
            return `rotate(${(this.text_m < 0.5 ? -90 : 90)+360*this.text_m} 
                            ${this.text_x} ${this.text_y})`;
        },
        text_anchor: function() {
            return this.text_m < 0.5 ? 'end' : 'start';
        },
        d: function() {
            var r    = this.gene.r;
            var from = this.gene.from;
            var to   = this.gene.to;

            var darrow = Math.min(Math.abs(from-to), this.style.darrow);

            var dr = Math.min(this.style.dr, 1);
            var wr = Math.min(this.style.warrow, 2);

            var sx = this.sx;
            var sy = this.sy;
            var mx = this.mx;
            var my = this.my;
            var mx =  r*Math.sin((to+(to > from ? -darrow : darrow))*2*Math.PI);
            var my = -r*Math.cos((to+(to > from ? -darrow : darrow))*2*Math.PI);
            var tx = this.tx;
            var ty = this.ty;

            var a = from <= to ? 1 : 0;
            var b = Math.abs(from-to) >= 0.5+darrow ? 1 : 0;

            var res;
            if(this.gene.f_arrow){
                res = 
                    `m ${sx*(1+dr)} ${sy*(1+dr)}
                     A ${r*(1+dr)} ${r*(1+dr)}, 0 ${b} ${a}, ${mx*(1+dr)} ${my*(1+dr)}
                     L ${mx*(1+dr+dr*wr)} ${my*(1+dr+dr*wr)}
                     L ${tx} ${ty}
                     L ${mx*(1-dr-dr*wr)} ${my*(1-dr-dr*wr)}
                     L ${mx*(1-dr)} ${my*(1-dr)}
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
        mouse_pos: 0,
        which: null,
        offset: 0,
        svg_size: 900,
    },
    methods: {
        addGene: function() {
            var new_gene = {
                key: this.key_counter++,
                name: "gene_" + this.key_counter,
                r: 1.0, 
                from: 0,
                to: 0.1,
                color: "#FFFFFF",
                f_arrow: true,
                f_visible: true,
                style_id: 0,
                style: {},
            }
            Object.assign(new_gene.style, this.g_style);

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
            this.offset = this.mouse_pos;
            this.drag = true;
        },
        mouseMove: function(event) {
            var svg = document.getElementById('plasmid-svg');
            var rect = svg.getBoundingClientRect();
            var x = event.clientX - rect.left - rect.width/2;
            var y = event.clientY - rect.top  - rect.height/2;
            var pos = (Math.atan2(-x, y) + Math.PI)/(2*Math.PI);
            this.mouse_pos = pos;

            if(!this.drag){
                return;
            }

            var which = this.which;
            var offset = this.offset;
            var min = Math.min(this.gene.from, this.gene.to);
            var max = Math.max(this.gene.from, this.gene.to);
            var d = 0;
            if(which == 'all'){
                if(max + pos-offset > 1){
                    d = 1 - max;
                }else if(min + pos-offset < 0){
                    d = 0 - min;
                }else{
                    d = pos-offset;
                }
                this.gene.from += d;
                this.gene.to   += d;
                this.offset = pos;
            }else{
                this.gene[which] = pos;
            }
        },
        mouseUp: function() {
            this.drag = false;
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
