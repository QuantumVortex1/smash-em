import * as Phaser from 'phaser';
import { Player } from '../entities/player';
import { BaseMonster, BasicSlime } from '../entities/monster';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private monsters!: Phaser.Physics.Arcade.Group;
  private monsterSpawnTimer: number = 0;

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
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
  }

  private createUI() {
    // Umrandungen (Stroke) für die Bars machen wir, indem wir unter den normalen Hintergrund 
    // nochmal ein minimal größeres, schwarzes Rechteck legen
    this.add.rectangle(18, 18, 204, 24, 0x000000).setOrigin(0, 0).setScrollFactor(0);
    this.add.rectangle(18, 48, 204, 19, 0x000000).setOrigin(0, 0).setScrollFactor(0);

    // HP Bar
    this.hpBarBg = this.add.rectangle(20, 20, 200, 20, 0x550000).setOrigin(0, 0).setScrollFactor(0);
    this.hpBarFill = this.add.rectangle(20, 20, 200, 20, 0xff2222).setOrigin(0, 0).setScrollFactor(0);

    // HP Text mittig über der Bar
    this.hpText = this.add.text(120, 30, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0);

    // XP Bar
    this.xpBarBg = this.add.rectangle(20, 50, 200, 15, 0x111144).setOrigin(0, 0).setScrollFactor(0);
    this.xpBarFill = this.add.rectangle(20, 50, 200, 15, 0x8833ff).setOrigin(0, 0).setScrollFactor(0);

    // XP Text mittig über der Bar
    this.xpText = this.add.text(120, 57, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5).setScrollFactor(0);

    // Level Text (nun rechts daneben mit kleiner Überarbeitung)
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
    this.player.update();
    this.updateUI();

    this.monsterSpawnTimer -= delta;
    if (this.monsterSpawnTimer <= 0) {
      this.spawnMonster();
      this.monsterSpawnTimer = 500 + Math.random() * 1000;
    }
  }

  private updateUI() {
    if (!this.player) return;

    // HP Update
    const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
    this.hpBarFill.width = 200 * hpPercent;
    this.hpText.setText(`${this.player.hp} / ${this.player.maxHp} HP`);

    // XP Update
    const xpPercent = Math.max(0, this.player.xp / this.player.maxXp);
    this.xpBarFill.width = 200 * xpPercent;
    this.xpText.setText(`${this.player.xp} / ${this.player.maxXp} XP`);

    this.levelText.setText(`Lvl ${this.player.level}`);
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

    const monster = new BasicSlime(this, spawnX, spawnY, this.player);
    this.monsters.add(monster);
  }

  private handlePlayerMonsterCollision(player: Player, monster: BaseMonster) {
    if (player.body.velocity.y > 0 && player.body.bottom <= monster.body.top + 20) {
      monster.takeDamage(1);
      this.spawnFloatingText(monster.x, monster.y - 20, '-1', '#ffffff');

      const xpGained = 5;
      player.gainXp(xpGained);
      this.spawnFloatingText(player.x, player.y - 40, `+${xpGained} XP`, '#aaffaa');

      player.body.setVelocityY(-400);
    } else {
      const damage = monster.damage;
      if (player.takeDamage(damage)) {
        this.spawnFloatingText(player.x, player.y - 20, `-${damage} HP`, '#ff4444');
      }
      monster.die();
    }
  }
}
