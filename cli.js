//$0: <zite root> <out dir>
const path=require("path")
const fs=require("fs")
const mkdirp=require("mkdirp")
const js2cof=require("js2coffee")

const splitter=require(__dirname+"/lib/fileSplit.js")

const root=path.resolve(process.argv[2])
const out=path.resolve(process.argv[3])
const files=[path.join(root,"js","all.js"),path.join(root,"css","all.css")]
mkdirp.sync(out);

files.concat([root,out]).map(p => {if (!fs.existsSync(p)) throw new Error("ENOTFOUND: "+p)})

files.map(f => {
  const content=fs.readFileSync(f).toString()
  const inside=splitter(content.split("\n")).map(file => {
    if (file.type=="coffee") {
      try {
        file.orig=file.content
        file.coffee=js2cof.build(file.content)
        file.content=file.coffee.code
      } catch(e) {
        if (e.start) {
          console.error(e.message.replace(/^input\.js/,file.path.replace(/\.coffee$/,".js")))
          //console.error(e.sourcePreview)
          //console.error("[E] %s %s:%s -> %s:%s | %s",file.path,file.start.line,file.start.column,file.end.line,file.end.column)
        } else {
          console.error("[COFFEE ERROR]",e)
        }
      }
    }
    file.out=path.join(out,file.path)
    return file
  })
  inside.map(file => {
    console.log("%s => %s",file.path,file.out)
    mkdirp.sync(path.dirname(file.out))
    fs.writeFileSync(file.out,new Buffer(file.content))
  })
})
