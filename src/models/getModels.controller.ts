import { Request, Response } from 'express';
import { getCurrentTime } from '../helpers';
import { Directus } from '@directus/sdk';

export async function getModelsController(req: Request, res: Response) {
	try {
		const directus = new Directus(
			process.env.DIRECTUS_URL || 'http://localhost:8055',
			{
				auth: {
					staticToken: process.env.DIRECTUS_TOKEN || '',
				},
			}
		);
		const models = await directus.items('cc_models').readByQuery({
			fields: [
				'*',
        'brand.*',
        'generations.*',
				'generations.hull_types.cc_hull_types_id.*',
        'generations.engines.cc_engines_id.*',
        'generations.engines.fuel.cc_engines_id.id',
        'generations.engines.fuel.cc_engines_id.name',
        'generations.engines.fuel.cc_engines_id.capacity',
        'generations.engines.fuel.cc_engines_id.horse_power',
        'generations.engines.fuel.cc_engines_id.fuel.*'
			],
			limit: -1,
		});
    const fuels = await directus.items('cc_fuels').readByQuery({
      fields: ['id', 'name', 'color'],
      limit: -1,
    });
    const posts = await directus.items('cc_posts').readByQuery({
      fields: ['model_generation'],
      limit: -1,
    });
		if (models.data == null || models.data.length === 0) {
			return res.status(200).send([]);
		}
    const splitedModels: any[] = [];
    models.data.forEach(model => {
      model.generations.forEach((generation: any) => {
        splitedModels.push({
          model_id: model.id,
          generation_id: generation.id,
          date_created: model.date_created,
          brand: model.brand,
          model: model.name,
          generation: generation.name,
          production_start: generation.production_start,
          production_end: generation.production_end,
          hull_types: generation.hull_types.map((hullType: any) => hullType.cc_hull_types_id),
          image: generation.image,
          engines: generation.engines.map((engine: any) => {
            return {
              ...engine.cc_engines_id,
              fuel: fuels.data?.find((fuel: any) => fuel.id === engine.cc_engines_id.fuel)
            }
          }),
          posts_count: posts.data?.filter((post: any) => post.model_generation === generation.id).length
        })
      });
    });
		console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 200 OK`);
		return res.status(200).send(splitedModels);
	} catch (error) {
		console.log(
			`[${getCurrentTime()}] ${req.method} ${req.url} 500 Bad Request`
		);
		console.error(error);
		return res.status(400).send({
			type: 'internal_server_error',
			message: 'Internal server error',
		});
	}
}
