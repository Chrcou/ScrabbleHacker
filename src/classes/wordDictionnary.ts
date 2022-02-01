import { getTextFile } from "./fetch";

export class wordDictionnary {
  url: string;
  dictionnary: string[] = [];
  countTable = {
    A: 1,
    E: 1,
    I: 1,
    L: 1,
    N: 1,
    O: 1,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    D: 2,
    G: 2,
    M: 2,
    B: 3,
    C: 3,
    P: 3,
    F: 4,
    H: 4,
    V: 4,
    J: 8,
    Q: 8,
    K: 10,
    W: 10,
    X: 10,
    Y: 10,
    Z: 10,
  };
  constructor(url: string) {
    this.url = url;
    getTextFile(this.url).then((value) => {
      this.dictionnary = value.data.map((word: string) => {
        return this.removeAccent(word).toUpperCase();
      });
      //console.log(this.dictionnary);
      // //console.log(this.search('€h€€€€',0,'btne'));
    });
  }

  replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(find, "g"), replace);
  }

  /**
   * Will search an expression based on the "expression" parameter
   * @param expression a word without some letters. All missing letters must be replaced by "€"
   * @param stringLength the wished caracters number
   * @param caracterList the list of letter which the player has in his hand (example : "abcd")
   * @returns a list of found word
   */
  search(expression: string, stringLength = 0, caracterList = "") {
    let regexpArgument: string;
    let baseDictionnary: string[];
    if (caracterList === "") {
      regexpArgument = "[a-zA-Z]";
    } else {
      regexpArgument = "[" + caracterList + "]";
    }
    let myRegExp = new RegExp(
      this.replaceAll(expression, "€", regexpArgument),
      "i"
    );
    //console.log(myRegExp);
    if (stringLength === 0) {
      baseDictionnary = this.dictionnary;
    } else {
      baseDictionnary = this.dictionnary.filter((str) => {
        return str.length <= stringLength;
      });
    }
    return baseDictionnary
      .filter((str: string) => {
        const matchArray = str.match(myRegExp);
        if (matchArray) {
          return true;
        } else {
          return false;
        }
      })
      .map((word) => {
        return { word: word, score: this.countPoint(word) };
      }).sort((a,b)=>{
        return b.score-a.score
      });
  }

  countPoint(word: string) {
    return [...word].reduce((previousValue, currentValue) => {
      return previousValue + this.countTable[currentValue];
    }, 0);
  }

  removeAccent(str: string) {
    var accent = [
      /[\300-\306]/g,
      /[\340-\346]/g, // A, a
      /[\310-\313]/g,
      /[\350-\353]/g, // E, e
      /[\314-\317]/g,
      /[\354-\357]/g, // I, i
      /[\322-\330]/g,
      /[\362-\370]/g, // O, o
      /[\331-\334]/g,
      /[\371-\374]/g, // U, u
      /[\321]/g,
      /[\361]/g, // N, n
      /[\307]/g,
      /[\347]/g, // C, c
    ];
    var noaccent = [
      "A",
      "a",
      "E",
      "e",
      "I",
      "i",
      "O",
      "o",
      "U",
      "u",
      "N",
      "n",
      "C",
      "c",
    ];

    // var str = this;
    for (var i = 0; i < accent.length; i++) {
      str = str.replace(accent[i], noaccent[i]);
    }

    return str;
  }
}
