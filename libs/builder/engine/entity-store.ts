import {merge, Observable, Subject} from 'rxjs';
import {concatMap, map, startWith, switchMap} from 'rxjs/operators';

import {asArray} from '../helpers';
import {bufferDebounce} from '../operators';
import {NgDocEntity} from './entities/abstractions/entity';
import {buildCandidates} from './functions/build-candidates';
import {initializeEntities} from './functions/initialize-entities';

/**
 *  FileEntity:
 * 		Init:
 * 			addSourceFile
 * 			compile
 * 		Change:
 * 			refreshSourceFile
 * 			compile
 * 		Destroy
 * 			nothing
 * 	ApiEntity
 * 		Init:
 * 			addSourceFile
 * 			compile
 * 			generateChildrenApiEntities
 * 		Change:
 * 			refreshSourceFile
 * 			compile
 * 			regenerateChildrenApiEntities
 * 		Destroy
 * 			removeChildrenEntities
 *
 */
export class NgDocEntityStore implements Iterable<NgDocEntity> {
	private entities: Map<string, NgDocEntity> = new Map();
	private entitiesChanged: Subject<NgDocEntity[]> = new Subject<NgDocEntity[]>();

	*[Symbol.iterator](): Iterator<NgDocEntity> {
		for (const value of asArray(this.entities.values())) {
			yield value;
		}
	}

	get changes(): Observable<NgDocEntity[]> {
		return this.entitiesChanged.pipe(
			bufferDebounce(20),
			map((entities: NgDocEntity[][]) => entities.flat()),
			concatMap(initializeEntities),
			switchMap((entities: NgDocEntity[]) =>
				merge(...asArray(this).map((entity: NgDocEntity) => entity.needToRebuild)).pipe(
					bufferDebounce(20),
					startWith(buildCandidates(entities)),
				),
			),
		);
	}

	get rootEntitiesForBuild(): NgDocEntity[] {
		return asArray(this.entities.values()).filter((entity: NgDocEntity) => entity.isRoot && entity.isReadyToBuild);
	}

	get(path: string): NgDocEntity | undefined {
		return this.entities.get(path);
	}

	asArray(): NgDocEntity[] {
		return asArray(this);
	}

	has(path: string): boolean {
		return this.entities.has(path);
	}

	add(...entities: NgDocEntity[]): void {
		if (entities.length) {
			entities.forEach((entity: NgDocEntity) => this.entities.set(entity.storeKey, entity));

			this.entitiesChanged.next(entities);
		}
	}

	remove(...entities: NgDocEntity[]): void {
		if (entities.length) {
			entities.forEach((entity: NgDocEntity) => this.entities.delete(entity.storeKey));

			this.entitiesChanged.next(entities);
		}
	}
}