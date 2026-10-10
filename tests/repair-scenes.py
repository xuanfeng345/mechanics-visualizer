from pathlib import Path
p=Path(__file__).resolve().parents[1]/'statics-scenes.js'
s=p.read_text(encoding='utf-8')
a=s.index('    // horizontal roller',s.index('function supportScene'))
b=s.index('  function beamCalc',a)
s=s[:a]+'''    s += svgText(380, 280, '箭头为未知反力的假定正方向；实际方向由平衡方程确定。', 'small', 'middle');
    return shell(s, '固定铰、水平滚动支座、固定端三种平面约束');
  }
'''+s[b:]
s=s.replace('ex=sx+400*Math.cos(r), ey=sy-400*Math.sin(r)','ex=sx+230*Math.cos(r), ey=sy-230*Math.sin(r)')
s=s.replace('bx=360+nx*bh/2; by=(sy-(360-sx)*Math.tan(r))+ny*bh/2;','bx=sx+125*ux-nx*bh/2; by=sy+125*uy-ny*bh/2;')
s=s.replace('if (c.static) force(bx,by,-c.driving*ux,-c.driving*uy', 'if (c.static) force(bx,by,c.driving*ux,c.driving*uy')
s=s.replace('force(bx,by,-c.maxF*ux,-c.maxF*uy','force(bx,by,c.maxF*ux,c.maxF*uy')
s=s.replace("supports:'三个固定铰、水平滚动支座、固定端反力示意；力单位可按图示理解。'","support:'固定铰、水平滚动支座、固定端；箭头为假定正方向。'")
s=s.replace("svgText(x0-10,205,'Rₐ = '+c.RA.toFixed(1)+' kN','teal','end')","svgText(x0+8,205,'Rₐ = '+c.RA.toFixed(1)+' kN','teal')")
p.write_text(s,encoding='utf-8')
