import { PLAYER_STATS_TABLES, RATINGS } from ".";

type AdvancedPlayerSearchField = {
	category: string;
	key: string;
	colKey: string;
	valueType: "numeric" | "string";
	getValue: (p: any) => string | number;

	// Used in worker to determine what data to fetch from playersPlus, if it's not just the string value in "key"
	workerFieldOverride?: string;
};

type MinimalAdvancedPlayerSearchField = Omit<
	AdvancedPlayerSearchField,
	"category" | "key"
>;

export const addPrefixForStat = (statType: string, stat: string) => {
	if (statType === "ratings") {
		if (stat === "ovr") {
			return "Ovr";
		}
		if (stat === "pot") {
			return "Pot";
		}
		return `rating:${stat}`;
	} else if (statType === "bio") {
		if (stat === "age") {
			return "Age";
		}
		if (stat === "draftPosition") {
			return "Draft Pick";
		}
		if (stat === "salary") {
			return "Salary";
		}
	}
	return `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`;
};

const ratingOptions: Record<string, MinimalAdvancedPlayerSearchField> = {};
for (const key of ["ovr", "pot", ...RATINGS]) {
	ratingOptions[key] = {
		colKey: addPrefixForStat("ratings", key),
		valueType: "numeric",
		getValue: p => p.ratings[key],
	};
}

const allFiltersTemp: Record<
	string,
	{
		options: Record<string, MinimalAdvancedPlayerSearchField>;
	}
> = {
	bio: {
		options: {
			name: {
				colKey: "Name",
				valueType: "string",
				getValue: p => p.name,
			},
			abbrev: {
				colKey: "Team",
				valueType: "string",
				getValue: p => p.abbrev,
			},
			college: {
				colKey: "College",
				valueType: "string",
				getValue: p => p.college,
			},
			country: {
				colKey: "Country",
				valueType: "string",
				getValue: p => p.born.loc,
				workerFieldOverride: "born",
			},
			draftYear: {
				colKey: "Draft Year",
				valueType: "numeric",
				getValue: p => p.draft.year,
				workerFieldOverride: "draft",
			},
			draftRound: {
				colKey: "Draft Round",
				valueType: "numeric",
				getValue: p => p.draft.round,
				workerFieldOverride: "draft",
			},
			draftPick: {
				colKey: "Draft Pick",
				valueType: "numeric",
				getValue: p => p.draft.pick,
				workerFieldOverride: "draft",
			},
			experience: {
				colKey: "Experience",
				valueType: "numeric",
				getValue: p => p.experience,
			},
		},
	},
	ratings: {
		options: ratingOptions,
	},
};

for (const [category, info] of Object.entries(PLAYER_STATS_TABLES)) {
	const options: Record<string, MinimalAdvancedPlayerSearchField> = {};
	for (const key of info.stats) {
		options[key] = {
			colKey: addPrefixForStat(category, key),
			valueType: "numeric",
			getValue: p => p.stats[key],
		};
	}

	allFiltersTemp[category] = {
		options,
	};
}

// Add key and category to each option
export const allFilters = allFiltersTemp as Record<
	string,
	{
		label: string;
		options: Record<string, AdvancedPlayerSearchField>;
	}
>;
for (const [category, { options }] of Object.entries(allFiltersTemp)) {
	for (const [key, value] of Object.entries(options)) {
		(value as any).key = key;
		(value as any).category = category;
	}
}
