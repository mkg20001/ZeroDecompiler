//$0: <zite root> <out dir>
const path = require("path")
const fs = require("fs")
const mkdirp = require("mkdirp")
const js2cof = require("js2coffee")

function repeat(s, n) {
  var r = "";
  for (var a = 0; a < n; a++) r += s;
  return r;
}
const preview = function Preview(lines, start, end) {
  const prev = lines[start.line - 2]
  const cur = lines[start.line - 1]
  const after = lines[start.line]
  console.log(prev)
  console.log(cur.bold)
  if (end)
    if (end.line != start.line) end = null;
  if (end) {
    console.log(repeat(" ", start.column - 1), repeat("~", end.column - start.column).red.bold)
  } else {
    console.log(repeat(" ", start.column - 1), "^".red.bold)
  }
  console.log(after)
}
require("colors")

const splitter = require(__dirname + "/lib/fileSplit.js")

const root = path.resolve(process.argv[2])
const out = path.resolve(process.argv[3])
const files = [path.join(root, "js", "all.js"), path.join(root, "css", "all.css")]
mkdirp.sync(out);

files.concat([root, out]).map(p => {
  if (!fs.existsSync(p)) throw new Error("ENOTFOUND: " + p)
})

files.map(f => {
  const content = fs.readFileSync(f).toString()
  const inside = splitter(content.split("\n")).map(file => {
    if (file.type == "coffee") {
      try {
        file.orig = file.content
        file.coffee = js2cof.build(file.content)
        file.content = file.coffee.code
        if (process.argv[4] && process.argv[4].toLowerCase().startsWith("-w")) file.coffee.warnings.forEach(warn => {
          const show = ["[WARN]".yellow.bold]
          show.push(file.path.white.bold, "@".yellow.bold)
          if (warn.end) {
            show.push(warn.start.line + ":" + warn.start.column + " -> " + warn.end.line + ":" + warn.end.column)
          } else if (warn.start) {
            show.push(warn.start.line + ":" + warn.start.column)
          } else {
            show.push("?".grey)
          }
          show.push(warn.description)
          console.log.apply(console, show)
          if (warn.start) preview(file.lines, warn.start, warn.end)
          console.log("")
        })
      } catch (e) {
        if (e.start) {
          console.error(e.message.replace(/^input\.js/, file.path.replace(/\.coffee$/, ".js")))
        } else {
          console.error("[JS2COFFEE ERROR]".red.bold, e)
        }
      }
    }
    file.out = path.join(out, file.path)
    return file
  })
  inside.map(file => {
    console.log("[WRITE]".blue.bold + " %s => %s".white.bold, file.path, file.out)
    mkdirp.sync(path.dirname(file.out))
    fs.writeFileSync(file.out, new Buffer(file.content))
  })
})
