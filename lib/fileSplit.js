
const re=/^\/\* ---- \/1[a-z0-9]{33}\/([\/a-z0-9.]*) ---- \*\/$/gmi

const path=require("path")

/*

How it looks:
===


* ---- /1_________________________________/(path/to/file) ---- *


===
*/
module.exports=function FileSplitter(ar) {
  let res=[]
  let cf
  var first=true
  let skip=0
  ar.map(l => {
    const m=re.exec(l)
    if (m) {
      if (cf) res.push(cf)
      const p=m[1]
      cf={
        path:p,
        type:path.extname(p).slice(1),
        name:path.basename(p),
        lines:[]
      }
      if (first) {first=false;cf.first=true}
      skip=2
    } else if (cf) {
      if (skip) skip--; else cf.lines.push(l)
    }
  })
  if (cf) {cf.last=true;res.push(cf)}
  return res.map(o => {
    if (!o.last) {
      o.lines.pop()
      o.lines.pop() //remove last 2 newlines
    }
    o.content=o.lines.join("\n")+"\n"
    return o
  })

}
