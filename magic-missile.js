/* Magic Missile - by DPro
This module adds a chat command /magicmissile (or /mm for short) to allow you to cast the
5e spell Magic Missile at a desired level. The default level is 1.
Chatcommands:
/magicmissile [level]
/mm [level]
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
      if (messageParts.length > 1) {
        let parsedLevel = parseInt(messageParts[1]);
        if (parsedLevel >= 1 && parsedLevel <= 9) {
          level = parsedLevel;
        }
      }

      // calculate the damage roll
      const numMissiles = 2 + level;
      const roll = new Roll(`${numMissiles}d4 + ${numMissiles}`);
      roll.roll();

      // produce new chat message
      roll.render().then(diceHtml => {
        // create spell description
        const levelStr = ordinal_suffix_of(level) + ' Level';
        let spellDescription;
        if (this.spell) {
          const sp = this.spell;
          const spd = this.spell.data.data;
          spellDescription = `
            <div class="dnd5e chat-card item-card" data-item-id="${sp.id}" data-spell-level="${level}">
              <header class="card-header flexrow">
                <img src="${sp.img}" title="${sp.name}" width="36" height="36">
                <h3 class="item-name">${sp.name}</h3>
              </header>
          
              <div class="card-content">${spd.description.value}</div>
          
              <div class="card-buttons">${diceHtml}
                <div class="magic-missile-damage">${spd.damage.parts[0][1]} damage</div>
              </div>
          
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
          spellDescription = `<div class="magic-missile-heading">Casting Magic Missile at ${levelStr}</div>` + 
            diceHtml + '<div class="magic-missile-damage">force damage</div>';
        }

        ChatMessage.create({
          content: `<div>${spellDescription}</div>`,
          type: CHAT_MESSAGE_TYPES.ROLL,
          speaker: data.speaker,
          roll
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
