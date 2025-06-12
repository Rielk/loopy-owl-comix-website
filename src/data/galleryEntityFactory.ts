import path from 'path';
import type { GalleryImage, Meta } from './galleryData.ts';
import exifr from 'exifr';

export async function createGalleryImage (
	galleryDir: string,
	file: string,
	meta: Meta
): Promise<GalleryImage> {
	const relativePath = path.relative(galleryDir, file);
	const exifData = await exifr.parse(path.join(galleryDir, relativePath));
	if (meta.title) 
		var title = meta.title;
	 else {
		var title = toReadableCaption(path.basename(relativePath, path.extname(relativePath)));
		meta.title = title
	}
	if (meta.collections.length > 0)
		var collections = meta.collections
	else {
		var collections = collectionIdForImage(relativePath)
		meta.collections = collections
	}
	const image = {
		path: systemPathToURLPath(file),
		meta: {
			title: title,
			description: meta.description,
			collections: collections,
		},
		exif: {},
	};
	if (exifData) {
		image.exif = {
			captureDate: exifData.DateTimeOriginal
				? new Date(`${exifData.DateTimeOriginal} UTC`)
				: undefined,
			fNumber: exifData.FNumber,
			focalLength: exifData.FocalLength,
			iso: exifData.ISO,
			model: exifData.Model,
			shutterSpeed: 1 / exifData.ExposureTime,
			lensModel: exifData.LensModel,
		};
	}
	return image;
};

function systemPathToURLPath(input: string): string {
	return input.replace(path.sep, "/")
}

function toReadableCaption(input: string): string {
	return input
		.replace(/[^a-zA-Z0-9]+/g, ' ') // Replace non-alphanumerics with space
		.split(' ') // Split by space
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize
		.join(' ');
}

function collectionIdForImage(relativePath: string) {
	return path.dirname(relativePath) === '.' ? [] : [path.dirname(relativePath)];
}

export function createGalleryCollection (dir: string) {
	return {
		id: dir,
		name: toReadableCaption(dir),
	};
};