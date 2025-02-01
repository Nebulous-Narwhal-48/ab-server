import { Circle } from 'collisions';
import { COLLISIONS_OBJECT_TYPES, MAP_SIZE, MAPS } from '../../constants';
import { COLLISIONS_ADD_OBJECT, COLLISIONS_REMOVE_OBJECT, TIMELINE_BEFORE_LOOP_START } from '../../events';
import { Mountain } from '../../types';
import HitCircles from '../components/hit-circles';
import Hitbox from '../components/hitbox';
import Id from '../components/mob-id';
import Position from '../components/position';
import Rotation from '../components/rotation';
import Entity from '../entity';
import { System } from '../system';

export default class GameMountains extends System {
  private start_id: number
  private end_id: number

  constructor({ app }) {
    super({ app });

    this.listeners = {
      [TIMELINE_BEFORE_LOOP_START]: this.loadMountains,
      ['UNLOAD_MOUNTAINS']: this.unloadMountains,
      ['LOAD_MOUNTAINS']: this.loadMountains,
    };
  }

  loadMountains(): void {
    let id: number;
    const MOUNTAIN_OBJECTS = MAPS[this.config.server.mapId].mountain_objects;
    MOUNTAIN_OBJECTS.forEach(([x, y, radius]) => {
      id = this.helpers.createMountainMobId();
      if (!this.start_id) {
        this.start_id = id
      }

      const mountain: Mountain = new Entity().attach(
        new Hitbox(),
        new HitCircles([[0, 0, radius]]),
        new Id(id),
        new Position(x, y),
        new Rotation(0)
      );

      mountain.hitbox.x = x + MAP_SIZE.HALF_WIDTH - radius;
      mountain.hitbox.y = y + MAP_SIZE.HALF_HEIGHT - radius;
      mountain.hitbox.height = radius * 2;
      mountain.hitbox.width = radius * 2;

      const hitbox = new Circle(mountain.hitbox.x + radius, mountain.hitbox.y + radius, radius);

      hitbox.id = mountain.id.current;
      hitbox.type = COLLISIONS_OBJECT_TYPES.MOUNTAIN;
      hitbox.isCollideWithProjectile = true;
      hitbox.isCollideWithPlayer = true;
      mountain.hitbox.current = hitbox;

      this.emit(COLLISIONS_ADD_OBJECT, mountain.hitbox.current);

      this.storage.mobList.set(mountain.id.current, mountain);
    });
    this.end_id = id;

    this.log.debug(`Mountains loaded: ${MOUNTAIN_OBJECTS.length}`);
  }

  unloadMountains(): void {
    for (let id = this.start_id; id <= this.end_id; id++) {
      const mountain = this.storage.mobList.get(id);
      this.emit(COLLISIONS_REMOVE_OBJECT, mountain.hitbox.current);
      this.storage.mobList.delete(id);
    }

    this.helpers.resetMountainMobIds();
    this.start_id = null;
    this.end_id = null;

    this.log.debug('Mountains unloaded.');
  }
}
