<script lang="ts">
  import { wordDictionnary } from "../../classes/wordDictionnary";
  import { store } from "../../stores/results.store";

  let results: { word: string; score: number }[] = [];
  let letterList = "";
  let searched = "";
  let charNumber: number = 3;
  let searchedExpression: string;
  const changeCharNumber = (e) => {
    charNumber = e.target.value;
    ////console.log(charNumber);
  };

  let dictionnary = new wordDictionnary("/liste_francais.json");
  const searchFromTextInput = (event) => {
    searched = event.target.value.toUpperCase();
    ////console.log(searched);
    if (searched.length > 2) {
      updateStore(dictionnary.search(searched, Number(charNumber), letterList));
    }
  };

  const updateStore = (results) => {
    store.update((data) => {
      return [ ...results];
    });
  };

  const searchFromLetterInput = (event) => {
    letterList = event.target.value;
    ////console.log(letterList);
    if (searched.length > 2) {
      updateStore(dictionnary.search(searched, Number(charNumber), letterList));
    }
  };
</script>

<div class="letterNumber">
  <label for="charNumber">Nombre de lettres souhaité</label>
  <input
    type="number"
    value={charNumber}
    name="charNumber"
    min="3"
    max="29"
    on:input={changeCharNumber}
  />
</div>

<div class="wordInput">
  <label for="wordInput"
    >Texte recherché (mettre un € pour les lettres inconnues)</label
  ><input
    type="text" class="scrabbleInput"
    maxlength={charNumber}
    id="scrabbleInput{charNumber}"
    name="wordInput"
    on:input={searchFromTextInput}
  />
  <label for="myLetter">Je dispose des lettre suivantes</label>
<input class=".scrabbleInput" type="text" name="myLetters" on:input={searchFromLetterInput} />

</div>


<style lang="scss">
  @import "wordInputStyles";
</style>
