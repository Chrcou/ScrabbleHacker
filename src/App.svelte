<script lang="ts">
  import WordInput from "./components/wordInput/wordInput.svelte";
  import WordShower from "./components/wordShower/wordShower.svelte";

  // import WordInput from 'components/wordInput/wordInput.svelte'
  export let name: string;
</script>


<h1>{name}</h1>
<main>

<WordInput />

<WordShower />
</main>
<style lang="scss">
  @import "./sass/globalImport.scss";
  :global(body) {
    background-color: $background;
    display: flex;
    font-family: $mainFont;
    align-items: center;
    flex-direction: column;
	padding:0px;
margin-top: 0;
    h1 {
    //   font-family: $mainFont;
      color: lighten($titleText,10%);
      text-transform: uppercase;
      font-size: 1.5em;
      font-weight: bolder;
      margin: 0;
      width: 100%;
	  text-align: center;
      background: rgba(51, 51, 51, 0.4);
	  height: 2em;
    }
  }

  main {    display: flex;
    flex-direction: column;
    width: 100%;color:$text;
    // text-align: center;
    // padding: 1em;
    // max-width: 240px;
    // margin: 0 auto;
    // width: 100%;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
