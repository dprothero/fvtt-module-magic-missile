/* Magic Missile - by DPro
This module adds a chat command /magicmissile (or /mm for short) to allow you to cast the
5e spell Magic Missile at a desired level. The default level is 1.
Chatcommands:
/magicmissile [level] [target_1_missiles, ..., target_n_missiles]
/mm [level] [target_1_missiles, ..., target_n_missiles]
*/

function ordinal_suffix_of(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

class MagicMissile {
  constructor() {
    this.spell = null;
  }

  findSpell() {
    if (!this.spell) {
      const pack = game.packs.get("dnd5e.spells");
      if (pack) {
        pack.getIndex().then(index => {
          const entry = index.find(e => e.name === "Magic Missile");
          if (entry) {
            pack.getEntity(entry._id).then(spell => {
              this.spell = spell;
            });
          }
        });
      }
    }
  }

  onChatMessage(message, content, data) {
    if (content.startsWith('/mm') || content.startsWith('/magicmissile')) {
      let level = 1;

      // parse the level from chat message
      const messageParts = content.split(' ');
      messageParts.shift(); // remove the /mm
      if (messageParts.length > 0) {
        const parsedLevel = parseInt(messageParts.shift());
        if (parsedLevel >= 1 && parsedLevel <= 9) {
          level = parsedLevel;
        }
      }

      // parse splits
      let missilesLeft = 2 + level;
      const missileSplits = [];
      while (messageParts.length > 0) {
        const parsedMissiles = parseInt(messageParts.shift());
        if (parsedMissiles > 0 && parsedMissiles <= missilesLeft) {
          missileSplits.push(parsedMissiles);
          missilesLeft = missilesLeft - parsedMissiles;
        }
      }
      if(missilesLeft > 0) {
        missileSplits.push(missilesLeft);
      }

      // calculate the damage roll(s)
      const rolls = [];
      missileSplits.forEach(numMissiles => {
        const roll = new Roll(`${numMissiles}d4 + ${numMissiles}`);
        roll.roll();
        rolls.push(roll.render());
      });

      // render dice roll(s)
      Promise.all(rolls).then(diceHtmlValues => {
        // create spell description
        const levelStr = ordinal_suffix_of(level) + ' Level';
        let spellDescription;
        if (this.spell) {
          const sp = this.spell;
          const spd = this.spell.data.data;

          // concatenate dice rolls
          const dicePrefix = '<div class="card-buttons">';
          const diceSuffix = `<div class="magic-missile-damage">${spd.damage.parts[0][1]} damage</div></div>`;
          const diceHtml = dicePrefix + diceHtmlValues.join(diceSuffix + dicePrefix) + diceSuffix;

          // render full spell description
          spellDescription = `
            <div class="dnd5e chat-card item-card" data-item-id="${sp.id}" data-spell-level="${level}">
              <header class="card-header flexrow">
                <img src="${sp.img}" title="${sp.name}" width="36" height="36">
                <h3 class="item-name">${sp.name}</h3>
              </header>
          
              <div class="card-content">${spd.description.value}</div>
          
              ${diceHtml}
          
              <footer class="card-footer">
                <span>${levelStr}</span>
                <span>V,S</span>
                <span>1 Creature</span>
                <span>1 Action</span>
                <span>120 Feet</span>
                <span>Instantaneous</span>
              </footer>
            </div>`
        } else {
          // concatenate dice rolls
          const diceSuffix = '<div class="magic-missile-damage">force damage</div>';
          const diceHtml = diceHtmlValues.join(diceSuffix) + diceSuffix;
          spellDescription = `<div class="magic-missile-heading">Casting Magic Missile at ${levelStr}</div>` + 
            diceHtml;
        }

        ChatMessage.create({
          content: `<div>${spellDescription}</div>`,
          speaker: data.speaker
        }, {});
      });

      return false;
    }
  }
}

let magicMissile;

Hooks.on("setup", () => {
  magicMissile = new MagicMissile();
  Hooks.on("chatMessage", magicMissile.onChatMessage.bind(magicMissile));
});

Hooks.on("ready", () => {
  magicMissile.findSpell();
});
