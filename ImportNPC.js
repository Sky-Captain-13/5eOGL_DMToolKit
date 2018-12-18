const ImportNPC = (() => {
    // VERSION INFORMATION
    const ImportNPC_Author = "Sky";
    const ImportNPC_Version = "1.0.0";
    const ImportNPC_LastUpdated = 0;
    
	// FUNCTIONS
	const createAttr = function(id, name, current, max) {
	    if (max) createObj("attribute", { name: name, characterid: id, current: current, max: max });
        else createObj("attribute", { name: name, characterid: id, current: current });
	}
	const generateRowID = function() {
        const generateUUID = (function() {
            var a = 0, b = [];
            return function() {
                var c = (new Date()).getTime() + 0, d = c === a;
                a = c;
                for (var e = new Array(8), f = 7; 0 <= f; f--) {
                    e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
                    c = Math.floor(c / 64);
                }
                c = e.join("");
                if (d) {
                    for (f = 11; 0 <= f && 63 === b[f]; f--) {
                        b[f] = 0;
                    }
                    b[f]++;
                } else {
                    for (f = 0; 12 > f; f++) {
                        b[f] = Math.floor(64 * Math.random());
                    }
                }
                for (f = 0; 12 > f; f++){
                    c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
                }
                return c;
            };
        }());
        return generateUUID().replace(/_/g, "Z");
    }
    const importNPCStats = function(msg_orig) {
        if (msg_orig.type !== "api" ) return;
        let msg = _.clone(msg_orig);
        let Command = msg.content.split(" ")[0]
        
        if (Command === "!import-npc" && playerIsGM(msg.playerid)) {
            let TokenID = msg.content.split(" ")[1];
            if (TokenID === undefined && msg.selected === undefined) return;
            if (msg.selected === undefined) msg.selected = [{"_id": TokenID, "_type": "graphic"}];
            _.each(msg.selected, function(a) {
                let Token = getObj("graphic", a["_id"]);
                let TokenImage = Token.get("imgsrc");
                let Statblock = Token.get("gmnotes", function(b) {})
                .replace(/(%3Cdiv%3E%3Cbr%3E%3C\/div%3E)/g, "")
                .replace(/(%3Cp%3E%3Cbr%3E%3C\/p%3E)/g, "")
                .replace(/(%20)/g, " ")
                .replace(/(%2C)/g, ",")
                .replace(/(%27)/g, "'")
                .replace(/(%28)/g, "(")
                .replace(/(%29)/g, ")")
                .replace(/(%3A)/g, ":")
                .replace(/(%u2013)/g, "–")
                .replace(/(%u2019)/g, "'")
                .replace(/(%u2212)/g, "-")
                .replace(/(%3Cdiv%3E)/g, "")
                .replace(/(%3C\/div%3E)/g, "~SPLITTER~")
                .replace(/(%3Cp%3E)/g, "")
                .replace(/(%3C\/p%3E)/g, "~SPLITTER~");

                if (Statblock.indexOf("Armor Class") !== -1 && Statblock.indexOf("Hit Points") !== -1 && Statblock.indexOf("Speed") !== -1) {
                    Statblock = Statblock.split("~SPLITTER~");
                    
                    // CREATE THE CHARACTER SHEET
                    let Character = createObj("character", { name: Statblock[0], inplayerjournals: "", controlledby: "" });
                    let id = Character.id;
                    
                    // ADD TOKEN IMAGE TO AVATAR ON CHARACTER SHEET
                    if (TokenImage.indexOf("marketplace") === -1) Character.set("avatar", TokenImage);
                    
                    // DISABLE CHARACTERMANCER BULLSHIT & SETUP NPC SHEET
                    createAttr(id, "l1mancer_status", "completed");
                    createAttr(id, "charactermancer_step", "l1-welcome");
                    createAttr(id, "npc", 1);
                    createAttr(id, "npc_name", Statblock[0]);
                    createAttr(id, "npc_options-flag", 0);
                    createAttr(id, "npc_type", Statblock[1]);
                    createAttr(id, "dtype", "full");
                    
                    // SET REPRESENTS ON TOKEN
                    Token.set("represents", Character.id);
                    
                    // ABILITY SCORES
                    let AbilityNames = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
                    let AbilityShort = ["str", "dex", "con", "int", "wis", "cha"];
                    let AbilityCount = 0;
                    let AbilityNum = 6;
                    _.each(AbilityNames, function(a) {
                        createAttr(id, a, Statblock[AbilityNum].split("(")[0]);
                        createAttr(id, a + "_base", Statblock[AbilityNum].split("(")[0]);
                        createAttr(id, a + "_mod", Math.floor(parseInt(Statblock[AbilityNum].split("(")[0]) / 2) - 5);
                        createAttr(id, "npc_" + AbilityShort[AbilityCount] + "_negative", (Statblock[AbilityNum].split("(")[0] < 10) ? 1 : 0);
                        AbilityCount += 1;
                        AbilityNum += 2;
                    });
                    
                    // AC, HP, SENSES, SPEED, etc.
                    _.each(Statblock, function(s) {
                        if (s.startsWith("Armor Class")) {
                            // ARMOR CLASS
                            createAttr(id, "npc_ac", s.replace("Armor Class ", "").split(" ")[0]);
                            if (s.indexOf("(") !== -1) createAttr(id, "npc_actype", s.split("(")[1].replace(")", ""));
                        } else if (s.startsWith("Hit Points")) {
                            createAttr(id, "hp_max", s.replace("Hit Points ", "").split(" ")[0]);
                            createAttr(id, "hp", s.replace("Hit Points ", "").split(" ")[0], s.replace("Hit Points ", "").split(" ")[0]);
                            createAttr(id, "npc_hpformula", s.split("(")[1].replace(")", ""));
                        } else if (s.startsWith("Speed")) {
                            createAttr(id, "npc_speed", s);
                        } else if (s.startsWith("Saving Throws")) {
                            let Count = 1;
                            let Saves = s.replace("Saving Throws ", "").split(",");
                            let SavesCount = Saves.length;
                            createAttr(id, "npc_saving_flag", 1);
                            _.each(Saves, function (t) {
                                let SaveName = t.trim().split(" ")[0].toLowerCase();
                                let SaveValue = t.trim().split(" ")[1].replace("+", "");
                                let SaveFlag = (SaveValue < 0) ? 3 : 1;
                                if (Count === SavesCount) SaveFlag = (SaveValue < 0) ? 4 : 2;
                                createAttr(id, "npc_" + SaveName + "_save_flag", SaveFlag);
                                createAttr(id, "npc_" + SaveName + "_save", SaveValue);
                                createAttr(id, "npc_" + SaveName + "_save_base", SaveValue);
                                Count++;
                            });
                        } else if (s.startsWith("Skills")) {
                            // SKILLS
                            let Count = 1;
                            let Skills = s.replace("Skills ", "").split(",");
                            let SkillsCount = Skills.length;
                            createAttr(id, "npc_skills_flag", 1);
                            _.each(Skills, function (k) {
                                let SkillName = k.trim().split(" ")[0].toLowerCase();
                                let SkillValue = k.trim().split(" ")[1].replace("+", "");
                                let SkillFlag = (SkillValue < 0) ? 3 : 1;
                                if (Count === SkillsCount) SkillFlag = (SkillValue < 0) ? 4 : 2;
                                createAttr(id, "npc_" + SkillName + "_flag", SkillFlag);
                                createAttr(id, "npc_" + SkillName + "_base", SkillValue);
                                createAttr(id, "npc_" + SkillName, SkillValue);
                                Count++;
                            });
                        } else if (s.startsWith("Damage Vulnerabilities")) {
                            createAttr(id, "npc_vulnerabilities", s.replace("Damage Vulnerabilities ", ""));
                        } else if (s.startsWith("Damage Resistances")) {
                            createAttr(id, "npc_resistances", s.replace("Damage Resistances ", ""));
                        } else if (s.startsWith("Damage Immunities")) {
                            createAttr(id, "npc_immunities", s.replace("Damage Immunities ", ""));
                        } else if (s.startsWith("Condition Immunities")) {
                            createAttr(id, "npc_condition_immunities", s.replace("Condition Immunities ", ""));
                        } else if (s.startsWith("Senses")) {
                            createAttr(id, "npc_senses", s.replace("Senses ", ""));
                        } else if (s.startsWith("Languages")) {
                            createAttr(id, "npc_languages", s.replace("Languages ", ""));
                        } else if (s.startsWith("Challenge")) {
                            createAttr(id, "npc_challenge", s.replace("Challenge ", "").split("(")[0].trim());
                            createAttr(id, "npc_xp", s.split("(")[1].replace(" XP)", ""));
                        } else {
                            // DO NOTHING
                        }
                    });
                    
                    // SEPERATE OUT THE TRAITS/ACTIONS/ETC
                    let i = 0;
                    while (Statblock[i].startsWith("Challenge") !== true) i++;
                    var Statblock2 = Statblock.slice(i + 1);
                    
                    let actions = {}; actions["Actions"] = [];
                    const categoryRegex =/^[A-Z][a-z]*(?:\s+[A-Z[a-z]*)*$/;
                    const actionRegex = /^[A-Z][a-z]*(?:\s+(?:[A-Z[a-z]*|\([^)]*\)))*\./;
                    const diceRegex = /[0-9]+\s*\((\s*[0-9]+d[0-9]+|[0-9]+d[0-9]+\s*[+-]\s*[0-9]+\s*)\)/g;
                    const startsWithDice = /^[0-9]+\s*\((\s*[0-9]+d[0-9]+|[0-9]+d[0-9]+\s*[+-]\s*[0-9]+\s*)\)/;
                    const dmgTypeRegex = /\b(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)\b/g;
                    let category = 'Traits';
                    
                    Statblock2.forEach( (line) => {
                        if (categoryRegex.test(line)){
                            category = line;
                        } else {
                            if (actionRegex.test(line) || !(actions[category] && actions[category].length)){
                                if (line.indexOf("if used with two hands") !== -1) {
                                    let lineStart = line.split("Hit:")[0].replace(".", " (Two-Handed).");
                                    let line1 = line.split("damage")[0].trim() + " damage";
                                    let line2 = lineStart + "Hit:" + line.split("damage, or")[1].replace(" if used with two hands.", "");
                                    actions[category] = actions[category] || [];
                                    actions[category].push(line1);
                                    actions[category].push(line2);
                                } else if (line.indexOf("if the swarm") !== -1) {
                                    let lineStart = line.split("Hit:")[0];
                                    let lineEnd = line.split("hit points or fewer.")[1].replace(" The", ", and the") || "";
                                    let line2 = lineStart + "Hit:" + line.split("damage, or")[1].replace(" if the swarm has half of its hit points or fewer.", "").replace("damage The", "damage, and");
                                    let line1 = line.split("damage, or")[0] + "damage" + lineEnd;
                                    actions[category] = actions[category] || [];
                                    actions[category].push(line1);
                                    actions[category].push(line2.replace(".", " (Weakened)."));
                                } else {
                                    actions[category] = actions[category] || [];
                                    actions[category].push(line);
                                    if (category === "Traits" && line.startsWith("Swarm.")) actions["Traits"].push("Weakened Swarm. A swarm that has fewer than half its hit points is weakened, dealing less damage with its attacks as noted below.");
                                    if (category === "Traits" &&  line.match(diceRegex) !== null) actions["Actions"].push(line);
                                }
                            } else {
                                actions[category] = actions[category] || [];
                                actions[category][actions[category].length-1] = `${actions[category][actions[category].length-1]} ${line}`;
                                
                            }
                        }
                    });
                    
                    if (actions["Reactions"]) createAttr(id, "npcreactionsflag", "1");
                    if (actions["Legendary Actions"]) {
                        createAttr(id, "npc_legendary_actions", actions["Legendary Actions"][0].match(/[0-9]+\slegendary\sactions/g)[0].split(" ")[0]);
                        actions["Legendary Actions"].shift();
                    }
                    
                    // CREATE TRAITS, ACTIONS, REACTIONS, LEGENDARY REACTIONS
                    _.each(actions["Traits"], function (t) {
                        let RowID = generateRowID();
                        let TraitName = t.split(".")[0] + ".";
                        let TraitDesc = t.slice(t.indexOf(".") + 2);
                        createAttr(id, `repeating_npctrait_${RowID}_name`, TraitName);
                        createAttr(id, `repeating_npctrait_${RowID}_desc`, TraitDesc);
                    });
                    
                    _.each(actions["Actions"], function (a) {
                        let RowID = generateRowID();
                        let ActionName = a.split(".")[0];
                        createAttr(id, `repeating_npcaction_${RowID}_npc_options-flag`, 0);
                        createAttr(id, `repeating_npcaction_${RowID}_name`, ActionName);
                        
                        if (a.indexOf("Attack:") === -1) {
                            let ActionDesc = a.slice(a.indexOf(".") + 2);
                            createAttr(id, `repeating_npcaction_${RowID}_rollbase`, "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}");
                            createAttr(id, `repeating_npcaction_${RowID}_description`, ActionDesc.replace(diceRegex, "[[$1]]").replace(/(DC\s[0-9]+(.*?)throw)/g, "**$1**"));
                        } else {
                            let ActionType = (a.indexOf("Melee") !== -1) ? "Melee" : "Ranged";
                            let ActionReachRange = (a.indexOf("Melee") !== -1) ? "Reach" : "Range";
                            let ActionRange = a.match(/(([0-9]+|[0-9]+\/[0-9]+)\sft.)/)[0];
                            let ActionToHit = a.match(/(\+|\-)[0-9]+/)[0].replace("+", "").trim();
                            let ActionTargets = a.split(",")[2].split(".")[0].trim(); 
                            let ActionOnHit = a.slice(a.indexOf("Hit:") + 5);
                            let ActionDmg = (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split("damage,")[0] : "";
                            let ActionDmgFlags = (startsWithDice.test(ActionOnHit) && ActionDmg.indexOf("plus") !== -1) ? "{{damage=1}} {{dmg1flag=1}} {{dmg2flag=1}}" : (startsWithDice.test(ActionOnHit)) ? "{{damage=1}} {{dmg1flag=1}}" : "";
                            let ActionOnHitDesc = (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split("damage, and")[1] || " " : ActionOnHit; 
                            if (ActionOnHitDesc !== " ") ActionOnHitDesc = "On a hit, " + ActionOnHitDesc.charAt(0).toLowerCase() + ActionOnHitDesc.slice(1).replace(diceRegex, "[[$1]]").replace(/(DC\s[0-9]+(.*?)throw)/g, "**$1**");
                            let ActionDmg1 = (ActionDmg.indexOf("(") !== -1) ? ActionDmg.split("(")[1].split(")")[0] : ActionDmg.split(" ")[0];
                            let ActionDmg1Type = (ActionDmg === "") ? "" : ActionDmg.split("plus")[0].match(dmgTypeRegex).join(" and ");
                            let ActionDmg1Crit = ActionDmg1.split(" ")[0];
                            let Action2ndDmg = ActionDmg.split("plus")[1];
                            let ActionDmg2 = "";
                            let ActionDmg2Type = "";
                            let ActionDmg2Crit = "";
                            let AtkMod = (ActionToHit >= 0) ? "+" : "";
                            if (Action2ndDmg !== undefined) {
                                ActionDmg2 = (Action2ndDmg.indexOf("(") !== -1) ? Action2ndDmg.split("(")[1].split(")")[0] : Action2ndDmg.split(" ")[0];
                                ActionDmg2Type = Action2ndDmg.match(dmgTypeRegex).join(" and ");
                                ActionDmg2Crit = ActionDmg2.split(" ")[0];
                            }
                            
                            createAttr(id, `repeating_npcaction_${RowID}_attack_flag`, "on");
                            createAttr(id, `repeating_npcaction_${RowID}_attack_type`, ActionType);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_range`, ActionRange);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_tohit`, ActionToHit);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_target`, ActionTargets);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_damage`, ActionDmg1.replace(/\s/g, ""));
                            createAttr(id, `repeating_npcaction_${RowID}_attack_damagetype`, ActionDmg1Type);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_crit`, ActionDmg1Crit);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_damage2`, ActionDmg2.replace(/\s/g, ""));
                            createAttr(id, `repeating_npcaction_${RowID}_attack_damagetype2`, ActionDmg2Type);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_crit2`, ActionDmg2Crit);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_onhit`, (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split(", and")[0] : "");
                            createAttr(id, `repeating_npcaction_${RowID}_show_desc`, "@{description}");
                            createAttr(id, `repeating_npcaction_${RowID}_description`, ActionOnHitDesc);
                            createAttr(id, `repeating_npcaction_${RowID}_damage_flag`, ActionDmgFlags);
                            createAttr(id, `repeating_npcaction_${RowID}_attack_tohitrange`, AtkMod + ActionToHit + ", " + ActionReachRange.toLowerCase() + " " + ActionRange + ", " + ActionTargets + ".");
                            createAttr(id, `repeating_npcaction_${RowID}_rollbase`, "@{wtype}&{template:npcaction} {{attack=1}} @{damage_flag} @{npc_name_flag} {{rname=@{name}}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{show_desc}}} @{charname_output}");
                        }
                    });
                    
                    _.each(actions["Reactions"], function (r) {
                        let RowID = generateRowID();
                        let TraitName = r.split(".")[0] + ".";
                        let TraitDesc = r.slice(r.indexOf(".") + 2);
                        createAttr(id, `repeating_npcreaction_${RowID}_name`, TraitName);
                        createAttr(id, `repeating_npcreaction_${RowID}_desc`, TraitDesc);
                    });
                    
                    _.each(actions["Legendary Actions"], function (l) {
                        let RowID = generateRowID();
                        let ActionName = l.split(".")[0];
                        createAttr(id, `repeating_npcaction-l_${RowID}_npc_options-flag`, 0);
                        createAttr(id, `repeating_npcaction-l_${RowID}_name`, ActionName);
                        
                        if (l.indexOf("Attack:") === -1) {
                            let ActionDesc = l.slice(l.indexOf(".") + 2);
                            createAttr(id, `repeating_npcaction-l_${RowID}_rollbase`, "@{wtype}&{template:npcaction} @{npc_name_flag} {{rname=@{name}}} {{description=@{show_desc}}} @{charname_output}");
                            createAttr(id, `repeating_npcaction-l_${RowID}_description`, ActionDesc.replace(diceRegex, "[[$1]]").replace(/(DC\s[0-9]+(.*?)throw)/g, "**$1**"));
                        } else {
                            let ActionType = (l.indexOf("Melee") !== -1) ? "Melee" : "Ranged";
                            let ActionReachRange = (l.indexOf("Melee") !== -1) ? "Reach" : "Range";
                            let ActionRange = l.match(/(([0-9]+|[0-9]+\/[0-9]+)\sft.)/)[0];
                            let ActionToHit = l.match(/(\+|\-)[0-9]+/)[0].replace("+", "").trim();
                            let ActionTargets = l.split(",")[2].split(".")[0].trim(); 
                            let ActionOnHit = l.slice(l.indexOf("Hit:") + 5);
                            let ActionDmg = (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split("damage,")[0] : "";
                            let ActionDmgFlags = (startsWithDice.test(ActionOnHit) && ActionDmg.indexOf("plus") !== -1) ? "{{damage=1}} {{dmg1flag=1}} {{dmg2flag=1}}" : (startsWithDice.test(ActionOnHit)) ? "{{damage=1}} {{dmg1flag=1}}" : "";
                            let ActionOnHitDesc = (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split("damage, and")[1] || " " : ActionOnHit; 
                            if (ActionOnHitDesc !== " ") ActionOnHitDesc = "On a hit, " + ActionOnHitDesc.charAt(0).toLowerCase() + ActionOnHitDesc.slice(1).replace(diceRegex, "[[$1]]").replace(/(DC\s[0-9]+(.*?)throw)/g, "**$1**");
                            let ActionDmg1 = (ActionDmg.indexOf("(") !== -1) ? ActionDmg.split("(")[1].split(")")[0] : ActionDmg.split(" ")[0];
                            let ActionDmg1Type = (ActionDmg === "") ? "" : ActionDmg.split("plus")[0].match(dmgTypeRegex).join(" and ");
                            let ActionDmg1Crit = ActionDmg1.split(" ")[0];
                            let Action2ndDmg = ActionDmg.split("plus")[1];
                            let ActionDmg2 = "";
                            let ActionDmg2Type = "";
                            let ActionDmg2Crit = "";
                            let AtkMod = (ActionToHit >= 0) ? "+" : "";
                            if (Action2ndDmg !== undefined) {
                                ActionDmg2 = (Action2ndDmg.indexOf("(") !== -1) ? Action2ndDmg.split("(")[1].split(")")[0] : Action2ndDmg.split(" ")[0];
                                ActionDmg2Type = Action2ndDmg.match(dmgTypeRegex).join(" and ");
                                ActionDmg2Crit = ActionDmg2.split(" ")[0];
                            }
                            
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_flag`, "on");
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_type`, ActionType);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_range`, ActionRange);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_tohit`, ActionToHit);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_target`, ActionTargets);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_damage`, ActionDmg1.replace(/\s/g, ""));
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_damagetype`, ActionDmg1Type);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_crit`, ActionDmg1Crit);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_damage2`, ActionDmg2.replace(/\s/g, ""));
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_damagetype2`, ActionDmg2Type);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_crit2`, ActionDmg2Crit);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_onhit`, (startsWithDice.test(ActionOnHit)) ? ActionOnHit.split(", and")[0] : "");
                            createAttr(id, `repeating_npcaction-l_${RowID}_show_desc`, "@{description}");
                            createAttr(id, `repeating_npcaction-l_${RowID}_description`, ActionOnHitDesc);
                            createAttr(id, `repeating_npcaction-l_${RowID}_damage_flag`, ActionDmgFlags);
                            createAttr(id, `repeating_npcaction-l_${RowID}_attack_tohitrange`, AtkMod + ActionToHit + ", " + ActionReachRange.toLowerCase() + " " + ActionRange + ", " + ActionTargets + ".");
                            createAttr(id, `repeating_npcaction-l_${RowID}_rollbase`, "@{wtype}&{template:npcaction} {{attack=1}} @{damage_flag} @{npc_name_flag} {{rname=@{name}}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{show_desc}}} @{charname_output}");
                        }
                    });
                    
                    if ("undefined" !== typeof DMToolKit && DMToolKit.Input) {
                        msg.content = "!fix-tokens";
                        DMToolKit.Input(msg);
                    }
                } else log ("ERROR: Not a valid statblock.");
            });
        }
    }
    const registerEventHandlers = function() {
        on(`chat:message`, importNPCStats);
        log("-=> ImportNPC v" + ImportNPC_Version + " <=- [" + (new Date(ImportNPC_LastUpdated * 1000)) + "]");
        //log(Date.now().toString().substr(0, 10));
    }

    on("ready", function() { registerEventHandlers(); });
})();
