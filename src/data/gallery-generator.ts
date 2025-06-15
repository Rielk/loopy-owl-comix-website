import { program } from 'commander';
import * as fs from 'node:fs';
import yaml from 'js-yaml';
import path from 'path';
import fg from 'fast-glob';
import { createNullMeta, type GalleryData, type GalleryImage, type GalleryMetaData, loadMetaData, NullGalleryMetaData, type SavedMeta } from './galleryData.ts';
import { createGalleryCollection, createGalleryImage } from './galleryEntityFactory.ts';

const defaultGalleryFileName = 'gallery.yaml';
const defaultMetaDataFileName = 'metadata.yaml';

async function generateGalleryFile(galleryDir: string): Promise<void> {
	try {
		let galleryDescriptions = await loadExistingMetaData(galleryDir);
		let {gallery: galleryObj, metadata: metadataObj} = await createGalleryObjFrom(galleryDir, galleryDescriptions.meta);
		await writeMetaDataYaml(galleryDir, metadataObj)
		await writeGalleryYaml(galleryDir, galleryObj);
	} catch (error) {
		console.error('Failed to create gallery file:', error);
		process.exit(1);
	}
}

async function loadExistingMetaData(galleryDir: string): Promise<GalleryMetaData> {
	const existingDescriptionsFile = path.join(galleryDir, defaultMetaDataFileName);
	if (fs.existsSync(existingDescriptionsFile)) {
		return await loadMetaData(existingDescriptionsFile);
	}
	return NullGalleryMetaData;
}

async function createGalleryObjFrom(galleryDir: string, existingMetaData: SavedMeta[])
	: Promise<{ gallery: GalleryData, metadata: GalleryMetaData }> {
	const imageFiles = await fg(`${galleryDir}/**/*.{jpg,jpeg,png}`, {
		dot: false,
	});
	const { images, metadata } = await createImagesFrom(imageFiles, galleryDir, existingMetaData)
	return {
		gallery: {
			collections: createCollectionsFrom(imageFiles, galleryDir),
			images: images
		},
		metadata: {
			meta: metadata
		}
	};
}

function createCollectionsFrom(imageFiles: string[], galleryDir: string) {
	const uniqueDirNames = new Set(
		imageFiles.map((file) => path.dirname(path.relative(galleryDir, file))),
	);

	return [...uniqueDirNames]
		.map((dir) => {
			return createGalleryCollection(dir);
		})
		.filter((col) => col.id !== '.');
}

async function createImagesFrom(imageFiles: string[], galleryDir: string, oldMetaData: SavedMeta[])
	: Promise<{ images: GalleryImage[], metadata: SavedMeta[] }> {
	const finalMetaData: SavedMeta[] = []
	const images = await Promise.all(imageFiles.map((file) => {
		const matchIndex = oldMetaData.findIndex(d => d.path == file)
		if (matchIndex >= 0)
			var savedMetaData = oldMetaData.splice(matchIndex, 1)[0]
		else 
			var savedMetaData = {
				path: file,
				meta: createNullMeta()
			}

		if (!savedMetaData.meta.title)
			console.warn(`Didn't find a title for image: "${file}"`)
		if (!savedMetaData.meta.description)
			console.warn(`Didn't find a description for image: "${file}"`)
		if (savedMetaData.meta.collections.length < 1)
			console.warn(`Didn't find any collections for image: "${file}"`)

		finalMetaData.push(savedMetaData)
		return createGalleryImage(galleryDir, file, savedMetaData.meta)
	}))
	for (const old of oldMetaData)
		console.warn(`Unused metadata for image "${old.path}"`)
	return {
		images: images,
		metadata: finalMetaData
	}
}

async function writeMetaDataYaml(galleryDir: string, metadataObj: GalleryMetaData) {
	const filePath = path.join(galleryDir, defaultMetaDataFileName);
	await fs.promises.writeFile(filePath, yaml.dump(metadataObj), 'utf8');
	console.log('Description file created/updated successfully at:', filePath);
}

async function writeGalleryYaml(galleryDir: string, galleryObj: GalleryData) {
	const filePath = path.join(galleryDir, defaultGalleryFileName);
	await fs.promises.writeFile(filePath, yaml.dump(galleryObj), 'utf8');
	console.log('Gallery file created/updated successfully at:', filePath);
}

program.argument('<path to images directory>');
program.parse();

const directoryPath = program.args[0];
if (!directoryPath || !fs.existsSync(directoryPath)) {
	console.error('Invalid directory path provided.');
	process.exit(1);
}

(async () => {
	await generateGalleryFile(directoryPath);
})().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
