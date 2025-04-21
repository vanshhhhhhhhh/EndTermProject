import { useState } from "react";
import "./App.css";

const typeColors = {
  fire: '#F05E14',
  water: '#0997FE',
  grass: '#5dc43f',
  bug: '#A3AC17',
  fairy: '#F0BFEE',
  psychic: '#FB5F9B',
  ground: '#a88940',
  rock: '#5C4033',
  flying: '#add8e6',
  electric: 'gold',
  ice: '#a2dfee',
  poison: '#8e44ad',
  normal: '#d3d3d3',
  fighting: '#b22222',
  ghost: '#4b0082',
  dragon: '#6a5acd',
  dark: '#382d26',
  steel: '#708090',
};

const App = () => {
  const [pokemon, setPokemon] = useState("");
  const [data, setData] = useState(null);
  const [abilities, setAbilities] = useState([]);
  const [flavor, setFlavor] = useState("");
  const [evolutionChain, setEvolutionChain] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setPokemon(e.target.value);
  };

  const fetchAbilities = async (abilitiesArray) => {
    const abilityDetails = await Promise.all(
      abilitiesArray.map(async (ab) => {
        const res = await fetch(ab.ability.url);
        const abilityData = await res.json();
        const englishEntry = abilityData.effect_entries.find(
          (entry) => entry.language.name === "en"
        );
        return {
          name: ab.ability.name,
          isHidden: ab.is_hidden,
          description: englishEntry ? englishEntry.effect : "No description available.",
        };
      })
    );
    setAbilities(abilityDetails);
  };

  const fetchEvolutionLine = async (speciesUrl) => {
    const speciesRes = await fetch(speciesUrl);
    const speciesData = await speciesRes.json();

    const flavorText = speciesData.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );
    setFlavor(flavorText ? flavorText.flavor_text : "No Pokédex entry available.");

    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    const getEvolutionsRecursive = async (node) => {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${node.species.name}`);
      const pokemonData = await res.json();

      const children = await Promise.all(
        node.evolves_to.map((child) => getEvolutionsRecursive(child))
      );

      return {
        name: node.species.name,
        sprite: pokemonData.sprites.front_default,
        children,
      };
    };

    const evoTree = await getEvolutionsRecursive(evoData.chain);
    setEvolutionChain(evoTree);
  };

  const fetchPokemon = () => {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemon}/`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Pokemon not found");
        return response.json();
      })
      .then((data) => {
        setData(data);
        setError("");
        fetchAbilities(data.abilities);
        fetchEvolutionLine(data.species.url);
      })
      .catch((error) => setError(error.message));
  };

  const renderEvolutionTree = (node) => {
    if (!node) return null;
    return (
      <div className="evo-node">
        <img src={node.sprite} alt={node.name} />
        <p>{node.name}</p>
        {node.children.length > 0 && (
          <div className="evo-children">
            {node.children.map((child) => (
              <div key={child.name} className="evo-branch">
                <span className="arrow">↓</span>
                {renderEvolutionTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const backgroundColor =
    data?.types?.[0]?.type?.name && typeColors[data.types[0].type.name]
      ? typeColors[data.types[0].type.name]
      : "#ffffff";

  return (
    <div className="container" style={{ backgroundColor }}>
      <div className="input">
        <input
          type="text"
          placeholder="Enter number between 1 to 1025"
          onChange={handleChange}
          value={pokemon}
        />
        <button className="btn" onClick={fetchPokemon}>
          Generate Pokemon
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {data && (
        <div className="pokemon-info">
          <h2 style={{ textTransform: "capitalize" }}>{data.name}</h2>
          <img src={data.sprites?.front_default} alt={data.name} />

          <div>
            <h3>Type(s):</h3>
            <ul>
              {data.types.map((typeInfo, index) => (
                <li key={index}>{typeInfo.type.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Pokédex Entry:</h3>
            <p className="flavor">{flavor}</p>
          </div>

          <div>
            <h3>Abilities:</h3>
            <ul>
              {abilities.map((ab, index) => (
                <li key={index}>
                  <strong>{ab.name}</strong> {ab.isHidden && "(Hidden)"}:{" "}
                  <span className="ability-desc">{ab.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Moves:</h3>
            <ul className="columns">
              {data.moves.map((moveInfo, index) => (
                <li className="moveList" key={index}>
                  {moveInfo.move.name.charAt(0).toUpperCase() +
                    moveInfo.move.name.slice(1)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Evolution Line:</h3>
            <div className="evolution-chain-tree">
              {renderEvolutionTree(evolutionChain)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
