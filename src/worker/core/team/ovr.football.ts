import orderBy from "lodash-es/orderBy";
import { helpers } from "../../../worker/util";

// See analysis/team-ovr-football

// onlyPos=true is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster
const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	{
		onlyPos,
		wholeRoster,
	}: {
		onlyPos?: string;
		wholeRoster?: boolean;
	},
) => {
	// minLength - number of players at this position who typically play in a game, barring injuries. These are the only players used when wholeRoster is false (normal power rankings).
	const info = {
		QB: {
			ovrs: [] as number[],
			minLength: 1,
			weights: [0.14020132],
		},
		RB: {
			ovrs: [] as number[],
			minLength: 2,
			weights: [0.04154452, 0.00650348],
		},
		TE: {
			ovrs: [] as number[],
			minLength: 2,
			weights: [0.02776459, 0.005],
		},
		WR: {
			ovrs: [] as number[],
			minLength: 5,
			weights: [0.02381475, 0.01436188, 0.01380022, 0.005, 0.005],
		},
		OL: {
			ovrs: [] as number[],
			minLength: 5,
			weights: [0.1362113, 0.10290326, 0.07238786, 0.07662868, 0.08502353],
		},
		CB: {
			ovrs: [] as number[],
			minLength: 3,
			weights: [0.07704007, 0.06184627, 0.03215704],
		},
		S: {
			ovrs: [] as number[],
			minLength: 3,
			weights: [0.04717957, 0.03800769, 0.00527162],
		},
		LB: {
			ovrs: [] as number[],
			minLength: 4,
			weights: [0.05825392, 0.0242329, 0.00794022, 0.005],
		},
		DL: {
			ovrs: [] as number[],
			minLength: 4,
			weights: [0.17763777, 0.12435656, 0.09421874, 0.07085633],
		},
		K: {
			ovrs: [] as number[],
			minLength: 1,
			weights: [0.04497254],
		},
		P: {
			ovrs: [] as number[],
			minLength: 1,
			weights: [0.0408595],
		},
	};

	const ratings = orderBy(
		players.map(p => p.ratings),
		"ovr",
		"desc",
	);

	for (const { ovr, pos } of ratings) {
		const infoPos = (info as any)[pos] as typeof info["P"] | undefined;
		if (infoPos && (onlyPos === undefined || onlyPos === pos)) {
			infoPos.ovrs.push(ovr);
		}
	}

	const INTERCEPT = -97.2246364425006;
	const DEFAULT_OVR = 20;

	let predictedMOV = INTERCEPT;
	for (const { ovrs, minLength, weights } of Object.values(info)) {
		const numToInclude = wholeRoster
			? Math.max(ovrs.length, minLength)
			: minLength;
		for (let i = 0; i < numToInclude; i++) {
			// Use DEFAULT_OVR if there are fewer than minLength players at this position
			const ovr = ovrs[i] ?? DEFAULT_OVR;

			let weight = weights[i];

			// Extrapolate weight for bench players
			if (weight === undefined) {
				// Decay slower for positions with many players, because injury substitutions will be more likely
				const base = (1 + minLength) * 0.1;
				const lastWeight = weights[weights.length - 1];
				const exponent = i - minLength + 1;
				weight = lastWeight * base ** exponent;
			}

			predictedMOV += weight * ovr;
		}
	}

	if (onlyPos || wholeRoster) {
		// In this case, we're ultimately using the value to compute a rank or some other relative score, so we don't care about the scale. And bounding the scale to be positive below makes it always 0.
		return predictedMOV;
	}

	// Translate from -15/15 to 0/100 scale
	const rawOVR = (predictedMOV * 100) / 30 + 50;
	return helpers.bound(Math.round(rawOVR), 0, Infinity);
};

export default ovr;
