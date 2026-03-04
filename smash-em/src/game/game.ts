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

  private statsTextLeft!: Phaser.GameObjects.Text;
  private statsTextMid!: Phaser.GameObjects.Text;
  private statsTextRight!: Phaser.GameObjects.Text;
  private highscore: number = 0;
  private lastUpgradeName: string = '-';
  
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

    this.createBackground();

    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.rectangle(400, 550, 800, 100, 0x1f1424);
    ground.setStrokeStyle(4, 0x000000);
    this.platforms.add(ground);

    const grass = this.add.rectangle(400, 500, 800, 20, 0x224a2e);
    grass.setStrokeStyle(2, 0x000000);
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

  private createBackground() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a0f2e, 0x1a0f2e, 0x0a1024, 0x0a1024, 1, 1, 1, 1);
    sky.fillRect(0, 0, w, h);

    this.add.circle(650, 150, 80, 0xd03e3e, 0.9);
    const moonGlow = this.add.circle(650, 150, 100, 0xd03e3e, 0.4);
    
    this.tweens.add({
      targets: moonGlow,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.2,
      duration: 3000,
      yoyo: true,
      repeat: -1
    });

    const mountains = this.add.graphics();
    mountains.fillStyle(0x120c1d, 1);
    mountains.beginPath();
    mountains.moveTo(0, h);
    mountains.lineTo(0, 300);
    mountains.lineTo(150, 180);
    mountains.lineTo(300, 320);
    mountains.lineTo(450, 190);
    mountains.lineTo(600, 270);
    mountains.lineTo(800, 200);
    mountains.lineTo(800, h);
    mountains.closePath();
    mountains.fillPath();

    const spawnCloud = (startX: number) => {
        const cloudW = Phaser.Math.Between(300, 600);
        const cloudH = Phaser.Math.Between(40, 100);
        const cloudy = Phaser.Math.Between(80, 400); 

        const cloud = this.add.ellipse(
            startX, 
            cloudy, 
            cloudW, 
            cloudH, 
            0x2c2640, 
            0.3
        );
        cloud.setDepth(-5);
        
        const speed = Phaser.Math.FloatBetween(10, 25);
        const distance = startX + cloudW;
        const duration = (distance / speed) * 1000;

        this.tweens.add({
            targets: cloud,
            x: -cloudW,
            duration: duration,
            onComplete: () => {
                cloud.destroy();
                spawnCloud(w + (cloudW / 2));
            }
        });
    };

    for (let i = 0; i < 6; i++) {
        spawnCloud(Phaser.Math.Between(0, w));
    }

    const trees = this.add.graphics();
    trees.fillStyle(0x0a0510, 1);
    for (let x = -20; x < w + 50; x += Phaser.Math.Between(20, 50)) {
        const y = 500;
        const treeW = Phaser.Math.Between(15, 35);
        const treeH = Phaser.Math.Between(60, 180);
        
        trees.fillTriangle(
            x, y, 
            x + treeW / 2, y - treeH, 
            x + treeW, y
        );
    }
  }

  private uiContainer!: Phaser.GameObjects.Container;

  private createUI() {
    this.uiContainer = this.add.container(0, 0);

    const hpBgBorder = this.add.rectangle(18, 18, 204, 24, 0x000000).setOrigin(0, 0).setScrollFactor(0);
    const xpBgBorder = this.add.rectangle(18, 48, 204, 19, 0x000000).setOrigin(0, 0).setScrollFactor(0);

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

    const statStyle = {
      fontSize: '12px',
      fontFamily: 'Courier',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    };

    this.statsTextLeft = this.add.text(20, 520, '', statStyle).setScrollFactor(0);
    this.statsTextMid = this.add.text(300, 520, '', statStyle).setScrollFactor(0);
    this.statsTextRight = this.add.text(580, 520, '', statStyle).setScrollFactor(0);

    this.uiContainer.add([
      hpBgBorder, xpBgBorder, 
      this.hpBarBg, this.hpBarFill, this.hpText, 
      this.xpBarBg, this.xpBarFill, this.xpText, 
      this.levelText,
      this.statsTextLeft, this.statsTextMid, this.statsTextRight
    ]);

    this.highscore = parseInt(localStorage.getItem('smash_em_highscore') || '0', 10);
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

      const minDelay = Math.max(600, 2500 - (this.gameTimeSeconds * 6));
      this.monsterSpawnTimer = minDelay + Math.random() * (minDelay * 0.4);
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

    this.statsTextLeft.setText(
      `ATTACK     : ${this.player.damage.toFixed(1)}\n` +
      `CRIT-CHANCE: ${Math.round(this.player.critChance * 100)}% (x${this.player.critMultiplier})\n` +
      `DMG TAKEN  : ${Math.round(this.player.defensiveDmgMult * 100)}%\n` +
      `MAX JUMPS  : ${this.player.maxJumps}`
    );

    const s = this.gameTimeSeconds;
    const phase = s < 45 ? 1 : s < 90 ? 2 : s < 150 ? 3 : s < 240 ? 4 : s < 360 ? 5 : 6;
    
    this.statsTextMid.setText(
      `PHASE      : ${phase}\n` +
      `SURVIVED   : ${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}\n` +
      `HIGHSCORE  : ${this.highscore}\n` +
      `PROGRESS   : ${this.highscore > 0 ? Math.min(100, Math.round((this.player.totalXp / this.highscore) * 100)) : 100}%`
    );

    this.statsTextRight.setText(
      `LAST UPGRADE:\n> ${this.lastUpgradeName}`
    );
  }

  public gameOver(finalScore: number) {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.body.enable = false;

    if (this.uiContainer) this.uiContainer.setVisible(false);

    this.cameras.main.shake(500, 0.03);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(this.player.x, this.player.y, 1000, 'Power2');
    this.cameras.main.zoomTo(2.5, 1000, 'Power2');

    const overlay = this.add.rectangle(this.player.x, this.player.y, 800 * 2, 600 * 2, 0xff0000, 0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.3,
      duration: 500
    });

    const title = this.add.text(this.player.x, this.player.y - 40, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Impact',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: [title],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('MenuScene', { score: finalScore });
          });
        });
      }
    });
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

    if (s < 45) pool = [0, 0, 0, 0, 1];
    else if (s < 90) pool = [0, 0, 1, 1, 2];
    else if (s < 150) pool = [0, 1, 1, 2, 2, 3];
    else if (s < 240) pool = [1, 1, 2, 2, 3, 4];
    else if (s < 360) pool = [1, 2, 3, 3, 4, 5];
    else pool = [2, 3, 4, 5, 5, 5];

    const chosenIndex = pool[Math.floor(Math.random() * pool.length)];
    const MonsterClass = MonsterTypes[chosenIndex];

    const monster = new MonsterClass(this, spawnX, spawnY, this.player);
    this.monsters.add(monster);
  }

  private awardXP(baseXp: number, isKill: boolean, textX: number, textY: number) {
    let finalXp = baseXp;

    let airMult = 1.0;
    if (this.consecutiveBounces >= 3) {
      if (this.consecutiveBounces <= 7) airMult = 1.0 + (this.consecutiveBounces - 2) * 0.2;
      else airMult = 2.0 + ((this.consecutiveBounces - 7) * 0.1);
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

    finalXp *= this.player.xpMult;
    finalXp = Math.round(finalXp * 10) / 10;
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
      if (player.hasXpFromDamage) xpGained += roundedDmg / 1.5;

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
            const aoeDmg = Math.round(player.damage * player.getSpeedDamageMultiplier(cachedFallSpeed) * 5) / 10;
            const aoeKilled = m.takeDamage(aoeDmg);
            this.spawnFloatingText(m.x, m.y - 20, `-${aoeDmg} AOE`, '#ff8800');

            let aoeXp = aoeKilled ? Math.max(1, m.killXP) : 0;
            if (player.hasXpFromDamage) aoeXp += aoeDmg / 1.5;
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
      if (!player.isInvulnerable) this.spawnFloatingText(player.x, player.y - 20, `-${Math.round(damage*player.defensiveDmgMult*10)/10} HP`, '#ff4444');
      player.takeDamage(damage);
      
      monster.die();
    }
  }

  private showUpgradeScreen() {
    this.physics.pause();

    const upgrades = getRandomUpgrades(this.player, 3);

    const overlayGroup = this.add.group();

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setScrollFactor(0);
    overlay.setDepth(100);
    overlay.setInteractive();

    const title = this.add.text(400, 150, 'LEVEL UP!', {
      fontSize: '48px',
      fontFamily: 'Impact',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0);
    title.setDepth(100);

    overlayGroup.add(overlay);
    overlayGroup.add(title);

    const selectUpgrade = (index: number) => {
      if (!this.physics.world.isPaused) return;
      if (!upgrades[index]) return;
      
      this.lastUpgradeName = upgrades[index].name;
      upgrades[index].apply(this.player);

      this.input.keyboard?.off('keydown-ONE');
      this.input.keyboard?.off('keydown-TWO');
      this.input.keyboard?.off('keydown-THREE');
      this.input.keyboard?.off('keydown-NUMPAD_ONE');
      this.input.keyboard?.off('keydown-NUMPAD_TWO');
      this.input.keyboard?.off('keydown-NUMPAD_THREE');

      overlayGroup.clear(true, true);
      this.physics.resume();
    };

    this.input.keyboard?.on('keydown-ONE', () => selectUpgrade(0));
    this.input.keyboard?.on('keydown-TWO', () => selectUpgrade(1));
    this.input.keyboard?.on('keydown-THREE', () => selectUpgrade(2));
    this.input.keyboard?.on('keydown-NUMPAD_ONE', () => selectUpgrade(0));
    this.input.keyboard?.on('keydown-NUMPAD_TWO', () => selectUpgrade(1));
    this.input.keyboard?.on('keydown-NUMPAD_THREE', () => selectUpgrade(2));

    upgrades.forEach((upgrade, index) => {
      const x = 200 + (index * 200);
      const y = 350;

      const cardContainer = this.add.container(x, y).setScrollFactor(0);
      cardContainer.setDepth(100);

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


