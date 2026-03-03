import * as Phaser from 'phaser';
import { Player } from '../entities/player';
import { BaseMonster, BloodshotEye, OcularWatcher, OchreJelly, DeathSlime, MurkySlaad, CrimsonSlaad } from '../entities/monster';
import { getRandomUpgrades } from './upgrades';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private monsters!: Phaser.Physics.Arcade.Group;
  private monsterSpawnTimer: number = 0;
  private gameTimeSeconds: number = 0;
  private lastBounceTime: number = 0;

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private monsterSpawnIndex: number = 0;

  private consecutiveBounces: number = 0;
  private killStreak: number = 0;
  private lastKillTime: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.spritesheet('player-idle', '/assets/player/16x16%20Idle-Sheet.png', { frameWidth: 20, frameHeight: 20 });
    this.load.spritesheet('player-walk', '/assets/player/16x16%20Walk-Sheet.png', { frameWidth: 20, frameHeight: 20 });

    this.load.spritesheet('bloodshot-eye', '/assets/monsters/BloodshotEye.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ocular-watcher', '/assets/monsters/OcularWatcher.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ochre-jelly', '/assets/monsters/OchreJelly.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('death-slime', '/assets/monsters/DeathSlime.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('murky-slaad', '/assets/monsters/MurkySlaad.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('crimson-slaad', '/assets/monsters/CrimsonSlaad.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player-walk', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });

    const monsterKeys = [
      'bloodshot-eye', 'ocular-watcher', 'ochre-jelly',
      'death-slime', 'murky-slaad', 'crimson-slaad'
    ];

    monsterKeys.forEach(key => {
      this.anims.create({
        key: `${key}-anim`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    });

    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.rectangle(400, 550, 800, 100, 0x654321);
    this.platforms.add(ground);

    const grass = this.add.rectangle(400, 500, 800, 20, 0x3CB371);
    this.platforms.add(grass);

    this.player = new Player(this, 380, 200);

    this.monsters = this.physics.add.group({
      runChildUpdate: true
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.monsters, this.platforms);

    this.physics.add.overlap(this.player, this.monsters, this.handlePlayerMonsterCollision as any, undefined, this);

    this.createUI();

    this.gameTimeSeconds = 0;
  }

  private createUI() {
    this.add.rectangle(18, 18, 204, 24, 0x000000).setOrigin(0, 0).setScrollFactor(0);
    this.add.rectangle(18, 48, 204, 19, 0x000000).setOrigin(0, 0).setScrollFactor(0);

    this.hpBarBg = this.add.rectangle(20, 20, 200, 20, 0x550000).setOrigin(0, 0).setScrollFactor(0);
    this.hpBarFill = this.add.rectangle(20, 20, 200, 20, 0xff2222).setOrigin(0, 0).setScrollFactor(0);

    this.hpText = this.add.text(120, 30, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);

    this.xpBarBg = this.add.rectangle(20, 50, 200, 15, 0x111144).setOrigin(0, 0).setScrollFactor(0);
    this.xpBarFill = this.add.rectangle(20, 50, 200, 15, 0x8833ff).setOrigin(0, 0).setScrollFactor(0);

    this.xpText = this.add.text(120, 57, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5).setScrollFactor(0);

    this.levelText = this.add.text(235, 26, 'Lvl 1', {
      fontSize: '24px',
      fontFamily: 'Impact',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setScrollFactor(0);
  }

  update(time: number, delta: number) {
    if (this.physics.world.isPaused) return;

    this.gameTimeSeconds += delta / 1000;

    if (this.player.body.blocked.down || (this.player.body.touching.down && this.player.body.velocity.y === 0)) {
      this.consecutiveBounces = 0;
    }

    if (this.player.pendingLevelUps > 0) {
      this.player.pendingLevelUps--;
      this.showUpgradeScreen();
      return;
    }

    this.player.update();
    this.updateUI();

    this.monsterSpawnTimer -= delta;
    if (this.monsterSpawnTimer <= 0) {
      this.spawnMonster();

      const minDelay = Math.max(400, 2000 - (this.gameTimeSeconds * 10));
      this.monsterSpawnTimer = minDelay + Math.random() * (minDelay * 0.5);
    }
  }

  private updateUI() {
    if (!this.player) return;

    const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
    this.hpBarFill.width = 200 * hpPercent;
    this.hpText.setText(`${this.player.hp} / ${this.player.maxHp} HP`);

    const nextLevelReq = this.player.currentLevelStartXp + (this.player.baseNextLevelXp * this.player.xpReqFactor);
    const currentProgress = this.player.totalXp - this.player.currentLevelStartXp;
    const requiredForCurrentLevel = nextLevelReq - this.player.currentLevelStartXp;

    const xpPercent = Math.max(0, Math.min(1, currentProgress / requiredForCurrentLevel));
    this.xpBarFill.width = 200 * xpPercent;
    this.xpText.setText(`${Math.floor(this.player.totalXp)} / ${Math.floor(nextLevelReq)} XP`);

    this.levelText.setText(`Lvl ${this.player.level}`);
  }

  public gameOver(finalScore: number) {
    this.scene.start('MenuScene', { score: finalScore });
  }

  private spawnFloatingText(x: number, y: number, message: string, color: string) {
    const text = this.add.text(x, y, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  private spawnMonster() {
    const spawnX = Math.random() > 0.5 ? 50 : 750;
    const spawnY = 100;

    const MonsterTypes = [
      BloodshotEye,
      OcularWatcher,
      OchreJelly,
      DeathSlime,
      MurkySlaad,
      CrimsonSlaad
    ];

    let pool: number[] = [];
    const s = this.gameTimeSeconds;

    if (s < 20) pool = [0, 0, 0, 0, 1];
    else if (s < 45) pool = [0, 0, 1, 1, 2];
    else if (s < 75) pool = [0, 1, 1, 2, 2, 3];
    else if (s < 120) pool = [1, 2, 2, 3, 3, 4];
    else if (s < 180) pool = [2, 3, 3, 4, 4, 5];
    else pool = [3, 4, 4, 5, 5, 5];

    const chosenIndex = pool[Math.floor(Math.random() * pool.length)];
    const MonsterClass = MonsterTypes[chosenIndex];

    const monster = new MonsterClass(this, spawnX, spawnY, this.player);
    this.monsters.add(monster);
  }

  private awardXP(baseXp: number, isKill: boolean, textX: number, textY: number) {
    let finalXp = baseXp;

    let airMult = 1.0;
    if (this.consecutiveBounces >= 3) {
      airMult = 1.0 + (this.consecutiveBounces - 2) * 0.1;
      finalXp *= airMult;
    }

    let killMult = 1;
    if (isKill) {
      const now = this.time.now;
      if (now - this.lastKillTime < 250) {
        this.killStreak++;
      } else {
        this.killStreak = 1;
      }
      this.lastKillTime = now;
      killMult = this.killStreak;
      finalXp *= killMult;
    }

    finalXp = Math.floor(finalXp);
    this.player.gainXp(finalXp);

    this.spawnFloatingText(textX, textY - 40, `+${finalXp} XP`, '#aaffaa');

    let yOffset = 60;
    if (airMult > 1.0) {
      this.spawnFloatingText(textX, textY - yOffset, `COMBO x${airMult.toFixed(1)}`, '#00ffff');
      yOffset += 20;
    }
    if (killMult > 1) {
      this.spawnFloatingText(textX, textY - yOffset, `${killMult}x KILL!`, '#ff22ff');
    }
  }

  private handlePlayerMonsterCollision(player: Player, monster: BaseMonster) {
    if (!monster.active || !player.active) return;

    const isFallingOrMonsterJumping = (player.body.velocity.y - monster.body.velocity.y) > 0;
    const isJustBounced = this.time.now - this.lastBounceTime < 50;

    const isAboveMonster = player.body.bottom < (monster.y + 10);

    if ((isFallingOrMonsterJumping || isJustBounced) && isAboveMonster) {
      if (this.time.now - this.lastBounceTime >= 50) this.consecutiveBounces++;

      this.lastBounceTime = this.time.now;
      const isCrit = Math.random() < player.critChance;
      const cachedFallSpeed = Math.abs(player.body.velocity.y);
      const damageDealt = (isCrit ? player.damage * player.critMultiplier : player.damage) * player.getSpeedDamageMultiplier(cachedFallSpeed);
      const roundedDmg = Math.max(1, Math.round(damageDealt * 10) / 10);

      const color = isCrit ? '#ffaa00' : '#ffffff';
      const killed = monster.takeDamage(roundedDmg);
      if (killed) this.spawnFloatingText(monster.x, monster.y, 'KILL!', '#ff4444');

      if (!killed && monster.active && monster.body) monster.body.setVelocityY(800);

      this.spawnFloatingText(monster.x, monster.y - 20, `-${roundedDmg}${isCrit ? ' CRIT!' : ''}`, color);

      let xpGained = killed ? monster.killXP : 1;
      if (player.hasXpFromDamage) xpGained += roundedDmg / 2;

      this.awardXP(xpGained, killed, player.x, player.y);

      if (player.hasBloodthirst && killed) {
        player.heal(1);
        this.spawnFloatingText(player.x, player.y - 120, '+1 HP', '#00ff00');
      }

      if (player.hasGroundSlam) {
        const aoeRadius = 30 + (cachedFallSpeed * 0.11);

        const shockwave = this.add.ellipse(player.x, player.y + 15, aoeRadius * 2, aoeRadius * 0.3, 0xffaa00, 0.6);
        shockwave.setScale(0.01);
        this.tweens.add({
          targets: shockwave,
          scaleX: 1,
          scaleY: 1,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => shockwave.destroy()
        });

        this.monsters.getChildren().forEach((c: any) => {
          const m = c as BaseMonster;
          if (m !== monster && Phaser.Math.Distance.Between(m.x, m.y, player.x, player.y) <= aoeRadius) {
            const aoeDmg = Math.round(player.getSpeedDamageMultiplier(cachedFallSpeed) * 10) / 10;
            const aoeKilled = m.takeDamage(aoeDmg);
            this.spawnFloatingText(m.x, m.y - 20, `-${aoeDmg} AOE`, '#ff8800');

            let aoeXp = aoeKilled ? Math.max(1, m.killXP) : 0;
            if (player.hasXpFromDamage) aoeXp += aoeDmg / 2;
            if (aoeXp > 0) {
              this.awardXP(aoeXp, aoeKilled, m.x, m.y);
            }
          }
        });
      }

      if (player.hasResetBounces) player.jumpsLeft = player.maxJumps;

      player.body.setVelocityY(player.bounceBoost);

    } else if (player.body.velocity.y <= 0 && isAboveMonster) {
      return;
    } else {
      const damage = monster.damage || 1;
      if (player.takeDamage(damage)) {
        this.spawnFloatingText(player.x, player.y - 20, `-${damage} HP`, '#ff4444');
      }
      monster.die();
    }
  }

  private showUpgradeScreen() {
    this.physics.pause();

    const upgrades = getRandomUpgrades(this.player, 3);

    const overlayGroup = this.add.group();

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setScrollFactor(0);
    overlay.setInteractive();

    const title = this.add.text(400, 150, 'LEVEL UP!', {
      fontSize: '48px',
      fontFamily: 'Impact',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);

    overlayGroup.add(overlay);
    overlayGroup.add(title);

    const selectUpgrade = (index: number) => {
      if (!upgrades[index]) return;
      upgrades[index].apply(this.player);

      this.input.keyboard?.removeKey('ONE');
      this.input.keyboard?.removeKey('TWO');
      this.input.keyboard?.removeKey('THREE');
      this.input.keyboard?.removeKey('NUMPAD_ONE');
      this.input.keyboard?.removeKey('NUMPAD_TWO');
      this.input.keyboard?.removeKey('NUMPAD_THREE');

      overlayGroup.clear(true, true);
      this.physics.resume();
    };

    this.input.keyboard?.once('keydown-ONE', () => selectUpgrade(0));
    this.input.keyboard?.once('keydown-TWO', () => selectUpgrade(1));
    this.input.keyboard?.once('keydown-THREE', () => selectUpgrade(2));
    this.input.keyboard?.once('keydown-NUMPAD_ONE', () => selectUpgrade(0));
    this.input.keyboard?.once('keydown-NUMPAD_TWO', () => selectUpgrade(1));
    this.input.keyboard?.once('keydown-NUMPAD_THREE', () => selectUpgrade(2));

    upgrades.forEach((upgrade, index) => {
      const x = 200 + (index * 200);
      const y = 350;

      const cardContainer = this.add.container(x, y).setScrollFactor(0);

      const borderColor = upgrade.rarity === 'rare' ? 0xffbb00 : upgrade.rarity === 'onetime' ? 0xaa22ff : 0xffffff;

      const cardBg = this.add.rectangle(0, 0, 180, 240, 0x222222).setInteractive({ useHandCursor: true });
      cardBg.setStrokeStyle(4, borderColor);

      const rarityText = this.add.text(0, -100, upgrade.rarity.toUpperCase(), {
        fontSize: '12px',
        color: upgrade.rarity === 'rare' ? '#ffbb00' : upgrade.rarity === 'onetime' ? '#aa22ff' : '#aaaaaa'
      }).setOrigin(0.5);

      const nameText = this.add.text(0, -60, upgrade.name, {
        fontSize: '20px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);

      const descText = this.add.text(0, 20, upgrade.description, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#dddddd',
        align: 'center',
        wordWrap: { width: 160 }
      }).setOrigin(0.5);

      const hintText = this.add.text(0, 100, `Taste [ ${index + 1} ]`, {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      cardContainer.add([cardBg, rarityText, nameText, descText, hintText]);
      overlayGroup.add(cardContainer);

      cardBg.on('pointerover', () => cardBg.setFillStyle(0x444444));
      cardBg.on('pointerout', () => cardBg.setFillStyle(0x222222));

      cardBg.on('pointerdown', () => selectUpgrade(index));
    });
  }
}


