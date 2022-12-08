import {getProjectTargetOptions} from '@angular/cdk/schematics';
import {JsonArray, JsonValue} from '@angular/compiler-cli/ngcc/src/utils';
import {Rule, SchematicContext} from '@angular-devkit/schematics';
import {ProjectDefinition, updateWorkspace, WorkspaceDefinition} from '@schematics/angular/utility/workspace';
import {Schema} from '../schema';
import {getProject} from '../utils/get-project';
import {NG_DOC_ASSETS} from '../constants/assets';

/**
 *
 * @param options
 * @param context
 */
export function addAssets(options: Schema, context: SchematicContext): Rule {
	return updateWorkspace((workspace: WorkspaceDefinition) => {
		context.logger.info(`[INFO]: Adding global assets...`);

		const project: ProjectDefinition | undefined = getProject(options, workspace);

		if (!project) {
			context.logger.warn(`[WARNING]: Target project not found.`);
			return;
		}

		const targetOptions: Record<string, JsonValue> = getProjectTargetOptions(project, 'build');

		const assets: JsonArray | undefined = targetOptions['assets'] as JsonArray | undefined;

		if (!assets) {
			targetOptions['assets'] = NG_DOC_ASSETS;
			return;
		}

		targetOptions['assets'] = Array.from(new Set([...NG_DOC_ASSETS, ...assets]));
	});
}