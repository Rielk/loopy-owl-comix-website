import { Github, Instagram } from 'lucide-astro';
import { type Props } from 'lucide-astro';

export interface SocialLink {
	name: string;
	url: string;
	icon: (_props: Props) => any;
}

export default {
	title: 'SR',
	favicon: 'favicon.ico',
	owner: 'Sara Richard',
	profileImage: 'profile.jpg',
	socialLinks: [
		{
			name: 'GitHub',
			url: 'https://github.com/Rielk/loopy-owl-comix-website',
			icon: Github,
		} as SocialLink,
		{
			name: 'Instagram',
			url: 'https://www.instagram.com',
			icon: Instagram,
		} as SocialLink,
	],
};
