const params = process.argv.slice(2);
var fs = require("fs");
const sample = require("./sample.json");
gc();
function gc() {
  console.log(params);
  params.forEach((arg) => {
    makeComponentsFolder("src/components", () => {
      makeComponentsFolder("src/components/" + arg, () => {
        makeSCSSFile(arg);
        makeSvelteFile(arg);
      });
    });
  });
  //Create folder components if necessary
}

function makeComponentsFolder(path, cb) {
  fs.mkdir(path, (err) => {
    if (err) {
      if (err.code === "EEXIST") {
        cb();
      } else {
        return console.error(err.code);
      }
    } else {
      console.log("Directory created successfully : " + path);
      cb();
    }
  });
}

function createFile(path, content) {
  if (fs.existsSync(path)) {
    //file exists
    console.error(path + " : already exists.");
  } else {
    fs.appendFile(path, content, function (err) {
      if (err) throw err;
      console.log(path +" : Saved!");
    });
  }
}

function makeSCSSFile(arg) {
  let filePath =
    "src/components/" + arg + "/" + arg + "Styles" + ".scss";
  createFile(filePath, "");
}

function makeSvelteFile(arg) {
  let filePath = "src/components/" + arg + "/" + arg + ".svelte";
  createFile(
    filePath,
    sample.svelteFile
      .replace("ùùù", arg + "Styles")
      .replace("°°°°", arg + " works !")
      .replaceAll("€", String.fromCharCode(34))
  );
}
