# 5eOGL_DMToolKit
A toolkit for DM's using the D&amp;D 5th Edition OGL Character Sheet on Roll20

## TURN ORDER TRACKER FEATURES

These four commands form the bulk of the Turn Order Tracker part of the Toolkit. Chat announcements and removal of deleted tokens or npc tokens that hit zero hit points happen automatically as tokens are deleted from the map or hit zero hp. 

!roll-init will silently roll initiative for all selected tokens and add them to the turn order tracker. When the turn order tracker is not empty, the script automatically opens the tracker. It does not have to be open before rolling. This command works for the GM only.

!sort-init will sort the turn order tracker, highest number to lowest number and doesn't do any kind of tie breakers. It simply sorts them by whatever mystical magic that the javascript sort function applies. Sometimes this benefits the PC's, sometimes the NPC's. You can always drag the tokens around in the tracker to make adjustments after it sorts. This command works for the GM only.

!clear-init clears the turn order tracker of all tokens in the turn order, removes the Green Dot status icon that the script uses to signal which token is at the top of the turn order, and closes the now empty turn order tracker. This command works for the GM only.

!eot can be used by by any player or the GM to advance the turn order tracker one space. Players can only advance the turn order if the token at the top of the tracker is a token/character they control. Using !eot when it is not their turn will do nothing.

## HEAL & DAMAGE TOKENS

The !heal and !damage commands can be used as simply as !heal 8 or !damage 10 to modify the hit points on a token. The commands can also take die rolls (no spaces in the roll though... so 2d4+2, NOT 2d4 + 2) and normally work on all selected tokens. You can add @{target||token_id} to heal or damage a specific token. This could be used to allow players to deal the damage to the tokens themselves if they want to feel a little more involved, since @{target||token_id} can be used on any token, not just ones you control.

!reset-tokens removes all status icons from the selected tokens and sets their current hit points equal to their maximum hit points. This is most useful for resetting all the tokens on a map for later use. Very useful for a campaign you use to run one shots with. Can also be used by players to reset their tokens after a long rest.

#### Example Macros
!heal ?{Hitpoints Healed|}
!damage ?{Damage Taken|}
!damage ?{Damage Dealt|} @{target||token_name}

/em drinks a healing potion.
!heal ?{Potion of|Healing,2d4+2|Greater Healing,4d4+4|Superior Healing,8d4+8|Supreme Healing,10d4+20|Restorative Ointment,2d8+2} @{selected||token_id}

## LIGHTS & VISION

The !vision macro uses the following to apply light and vision settings to the selected token. 
!vision ?{Light/Vision Source|None,none|Candle,candle|Continual Flame,continual_flame|Fire Beetle,fire_beetle|Darkvision (60ft),darkvision_60|Darkvision (90ft),darkvision_90|Darkvision (120ft),darkvision_120|Daylight,daylight|Everburning Torch,everburning_torch|Lamp,lamp|Lantern (Bullseye),lantern_bullseye|Lantern (Bright),lantern_hooded_bright|Lantern (Dim),lantern_hooded_dim|Light,light|Torch,torch|Sunrod,sunrod} @{selected|token_id}

!dl simply toggles the dynamic lighting on or off on the page you are on. You can also use !dl off or !dl on instead.

## TOKEN STATUS ICONS

The !icon command lets you or players apply status icons to selected or targeted tokens. The list below is what I have come up with for my own games. You can omit @{target||token_id} to apply the chosen icon to all selected tokens.

!icon ?{Condition|Readied Action,sentry-gun|Blinded,bleeding-eye|Charmed,broken-heart|Deafened,screaming|Dodging,lightning-helix|Exhaustion,half-haze|Frightened,broken-skull|Grappled,grab|Incapacitated,pummeled|Help Other,spanner|Hex,death-zone|Hunter's Mark,archery-target|Invisible,ninja-mask|Paralyzed,interdiction|Petrified,padlock|Poisoned,drink-me|Prone,back-pain|Restrained,fishing-net|Slowed,snail|Stunned,overdrive|Unconscious,sleepy} @{target||token_id}

**Hunter's Mark Macro for Rangers:** !icon archery-target @{target||token_id}

## Group Checks

The !group-check command lets you roll ability checks, skill checks, and saving throws for all selected tokens. Most useful for when the Wizard drops a fireball on ten to fifteen goblins. There are three macros that are already set up for this part of the script. The script simply sends the template to chat for each selected token, in order of their names. It does not auto-calculate success or failure. It is simply a tool to speed up rolling those checks

!group-check ?{Ability Check|Strength Check,--Check --Strength --STR|Dexterity Check,--Check --Dexterity --DEX|Constitution Check,--Check --Constitution --CON|Intelligence Check,--Check --Intelligence --INT|Wisdom Check,--Check --Wisdom --WIS|Charisma Check,--Check --Charisma --CHA} ?{Roll Type|Public,--PUBLIC|Private,--GM}

!group-check ?{Skill Check|Acrobatics,--Skill --Acrobatics --X|Arcana,--Skill --Arcana --X|Athletics,--Skill --Athletics --X|Deception,--Skill --Deception --X|History,--Skill --History --X|Insight,--Skill --Insight --X|Intimidation,--Skill --Intimidation --X|Investigation,--Skill --Investigation --X|Medicine,--Skill --Medicine --X|Nature,--Skill --Nature --X|Perception,--Skill --Perception --X|Performance,--Skill --Performance --X|Persuasion,--Skill --Persuasion --X|Religion,--Skill --Religion --X|Sleight of Hand,--Skill --Sleight of Hand --X|Stealth,--Skill --Stealth --X|Survival,--Skill --Survival --X} ?{Roll Type|Public,--PUBLIC|Private,--GM}

!group-check ?{Saving Throw|Strength Save,--Save --Strength --STR|Dexterity Save,--Save --Dexterity --DEX|Constitution Save,--Save --Constitution --CON|Intelligence Save,--Save --Intelligence --INT|Wisdom Save,--Save --Wisdom --WIS|Charisma Save,--Save --Charisma --CHA} ?{Roll Type|Public,--PUBLIC|Private,--GM}

## TOKEN CONFIGURATION
At the top of the script, there's four options for setting the bars on the tokens. These settings are for NPC mooks only. Tokens that represent a group of things, like Goblins. The settings are not meant for unique NPC's or PC's. As such, the script only changes the hit points and bar settings of tokens that do not have a bar linked to an attribute like a PC would. For example, by default, many npc tokens in Roll20 official modules have Bar2 linked to npc_ac and Bar1 contains the current and max hit points, but is NOT linked to the npc_hp attribute on the character sheet. This means that each token has their own unique pool of hit points. Whereas if the hp was linked to the sheet, changing it on one token would change it on all tokens representing that sheet. I personally change the hit points to bar three so that the bar doesn't overlap the token above.

You can disable all bar changes by setting these to 0:

* const ARMOR_CLASS_BAR        = 0;
* const HIT_POINT_BAR          = 0;
* const PASSIVE_PERCEPTION_BAR = 0;
* const SPEED_BAR              = 0;

!fix-tokens is used to fix tokens that were already on a map before adding this script. Simply select all the tokens and enter the command into chat. It will alter the tokens to match what they would be if they were just dropped onto the map. This command is for npc tokens only.

## USER CONFIGURATION
Last, but not least is the user configuration section. Use these variables to customize the behaviour of the script.

// USER CONFIGURATION -- Set to true/false or hex color code.
* const ANNOUNCE_NEW_TURN     = true;
  * If true, announces each turn in chat.
* const CHECK_INSTANT_DEATH   = true;
  * If true, sets a red X on PC's that take enough damage to kill them instantly.
* const CHECK_SYSTEM_SHOCK    = true;
  * This doesn't really do anything yet, but will someday.
* const NPC_COLOR             = "#444444";
  * Sets the NPC color for turn order announcements.
* const PC_COLOR              = "#073763";
  * Sets the PC color for turn order announcements if USE_PLAYER_COLOR is false.
* const PULL_GM_TO_TOKEN      = true;
  * If true, will pull the GM to the location of the token at the top of the turn order.
* const RANDOM_NPC_HP         = true;
  * If true, will randomly generate npc hp based on their hp formula on the character sheet.
* const SHOW_GREEN_DOT        = true;
  * Adds a green dot to the token at the top of the turn order.
* const SHOW_HALF_HITPOINTS   = true;
  * Adds the half-heart status icon when a token falls under half its maximum hit points.
* const SHOW_NPC_HITPOINTS    = true;
  * Allows players to see the hp bars of npc tokens. It does not let them see the actual hit points.
* const SHOW_NPC_NAMES        = true;
  * Shows NPC names in the turn order tracker and chat announcements.
* const SHOW_NPC_STATBLOCK    = true;
  * Whispers an npc statblock to the GM when the npc is at the top of the turn order.
* const USE_PLAYER_COLOR      = true;
  * Uses the player's selected color next to their name at the bottom of Roll20 for turn order announcements.
