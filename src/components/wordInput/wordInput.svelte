<script lang="ts">
  import { wordDictionnary } from "../../classes/wordDictionnary";

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
    if(searched.length>2){    results = dictionnary.search(searched, Number(charNumber),letterList);}

  };

  const searchFromLetterInput = (event) => {
    letterList = event.target.value;
    ////console.log(letterList);
    if(searched.length>2){    results = dictionnary.search(searched, Number(charNumber),letterList);}

  };
</script>

<div>wordInput works !</div>
<label for="charNumber" >Nombre de lettre souhaité</label>
<input type="number" value="{charNumber}" name="charNumber"  min="3" max="29"  on:input={changeCharNumber} />

<input
  type="text"
  maxlength={charNumber}
  id="wordInput{charNumber}"
  on:input={searchFromTextInput}
/>

<label for="myLetter">Je dispose des lettre suivantes</label>
<input type="text" name="myLetters" on:input={searchFromLetterInput} />

<h1>Résultats</h1>
<ol class="gradient-list">
  {#each results as result}
    <li>
      {result.word} - {result.score}pts - {result.word.length} lettres
      <a
        href="https://www.larousse.fr/dictionnaires/francais/{result.word}"
        target="_blank">(voir la défintion)</a
      >
    </li>
  {/each}
</ol>

<style lang="scss">
  @import "wordInputStyles";
</style>
