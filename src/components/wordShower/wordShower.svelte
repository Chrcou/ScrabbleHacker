<script lang="ts">
  import { store } from "../../stores/results.store";

  let results;
  store.subscribe((data) => {
    results = data;
    console.log(results);
  });
</script>

<div class="resultArea">
  <h2>Résultats</h2>
  <ul>
    {#each results as result}
      <li>
        {result.word} - {result.score}pts - {result.word.length} lettres
        <a
          href="https://www.larousse.fr/dictionnaires/francais/{result.word}"
          target="_blank">(voir la défintion)</a
        >
      </li>
    {/each}
  </ul>
</div>

<style lang="scss">
  @import "wordShowerStyles";
</style>
