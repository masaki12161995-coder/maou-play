"use strict";

const UI_WIDTH=402, UI_HEIGHT=874;
const FIELD_PIXEL=2, ARENA_PIXEL=6, HUD_PIXEL=4;

function through(value,from,to){
  const i=Math.max(0,Math.min(from.length-2,from.findLastIndex(v=>v<=value)));
  const span=from[i+1]-from[i];
  return span ? to[i]+(value-from[i])*(to[i+1]-to[i])/span : to[i];
}

class Viewport {
  constructor(rect,dpi,safeRect=rect){
    this.width=rect.width;
    this.height=rect.height;
    this.dpi=dpi;
    this.pixelWidth=Math.max(1,Math.round(rect.width*dpi));
    this.pixelHeight=Math.max(1,Math.round(rect.height*dpi));
    this.left=Math.max(0,safeRect.left-rect.left);
    this.top=Math.max(0,safeRect.top-rect.top);
    this.right=Math.max(this.left+1,Math.min(this.width,safeRect.left+safeRect.width-rect.left));
    this.bottom=Math.max(this.top+1,Math.min(this.height,safeRect.top+safeRect.height-rect.top));
    const available=this.bottom-this.top;
    this.yReference=[0,72,126,740,816,UI_HEIGHT];
    this.yActual=[0,this.top,this.top+Math.min(54,available*.13),
      this.bottom-Math.min(76,available*.18),this.bottom,this.height];
  }
  x(value){
    return this.left+value*(this.right-this.left)/UI_WIDTH;
  }
  y(value){
    return through(value,this.yReference,this.yActual);
  }
  point(x,y) {
    return [(x-this.left)*UI_WIDTH/(this.right-this.left),through(y,this.yActual,this.yReference)];
  }
  dotX(value){return Math.round(this.x(value)*this.dpi/FIELD_PIXEL);}
  dotY(value){return Math.round(this.y(value)*this.dpi/FIELD_PIXEL);}
  inside(x,y){return x>=this.left&&x<this.right&&y>=this.top&&y<this.bottom;}
  planes(){
    const dots=factor=>[Math.ceil(this.pixelWidth/factor),Math.ceil(this.pixelHeight/factor)];
    return [dots(FIELD_PIXEL),dots(ARENA_PIXEL),dots(HUD_PIXEL)];
  }
}

function fitViewportRoot(root){
  const vv=window.visualViewport;
  if(!root?.style||!vv?.width||!vv?.height)return;
  root.style.left=vv.offsetLeft+"px";
  root.style.top=vv.offsetTop+"px";
  root.style.width=vv.width+"px";
  root.style.height=vv.height+"px";
}

function uiDotX(ctx,value){return ctx.uiLayout?.dotX(value)??Math.round(value*1.5);}
function uiDotY(ctx,value){return ctx.uiLayout?.dotY(value)??Math.round(value*1.5);}
