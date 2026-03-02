import * as Phaser from 'phaser';
import { Player } from '../entities/player';
import { BaseMonster, BasicSlime } from '../entities/monster';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private monsters!: Phaser.Physics.Arcade.Group;
  private monsterSpawnTimer: number = 0;

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
  }

  update(time: number, delta: number) {
    this.player.update();

    this.monsterSpawnTimer -= delta;
    if (this.monsterSpawnTimer <= 0) {
      this.spawnMonster();
      this.monsterSpawnTimer = 500 + Math.random() * 1000;
    }
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
      player.body.setVelocityY(-400); 
    } else {
      player.takeDamage(monster.damage);
      monster.die();
    }
  }
}

