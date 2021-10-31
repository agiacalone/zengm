import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import { ForceWin, MoreLinks, ScoreBox } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { toWorker, useLocalShallow } from "../util";
import allowForceTie from "../../common/allowForceTie";

const Schedule = ({
	abbrev,
	completed,
	elam,
	elamASG,
	phase,
	tid,
	ties,
	upcoming,
}: View<"schedule">) => {
	useTitleBar({
		title: "Schedule",
		dropdownView: "schedule",
		dropdownFields: { teams: abbrev },
	});

	const { gameSimInProgress, godMode } = useLocalShallow(state => ({
		gameSimInProgress: state.gameSimInProgress,
		godMode: state.godMode,
	}));

	const [forcingAll, setForcingAll] = useState(false);
	const [forceWinKey, setForceWinKey] = useState(0);

	const handleForceAll =
		(type: "win" | "lose" | "tie" | "none") => async () => {
			setForcingAll(true);
			await toWorker("main", "setForceWinAll", tid, type);
			setForceWinKey(key => key + 1);
			setForcingAll(false);
		};

	return (
		<>
			<MoreLinks type="team" page="schedule" abbrev={abbrev} tid={tid} />
			{godMode ? (
				<div className="btn-group mb-3">
					<button
						className="btn btn-outline-god-mode"
						onClick={handleForceAll("win")}
						disabled={forcingAll}
					>
						Force win all
					</button>
					<button
						className="btn btn-outline-god-mode"
						onClick={handleForceAll("lose")}
						disabled={forcingAll}
					>
						Force lose all
					</button>
					{allowForceTie({
						// Doesn't matter what team, we're just checking in general
						homeTid: 0,
						awayTid: 0,
						elam,
						elamASG,
						phase,
						ties,
					}) ? (
						<button
							className="btn btn-outline-god-mode"
							onClick={handleForceAll("tie")}
							disabled={forcingAll}
						>
							Force tie all
						</button>
					) : null}
					<button
						className="btn btn-outline-god-mode"
						onClick={handleForceAll("none")}
						disabled={forcingAll}
					>
						Reset all
					</button>
				</div>
			) : null}
			<div className="row">
				<div className="col-sm-6">
					<h2>Upcoming Games</h2>
					<ul className="list-group">
						{upcoming.map((game, i) => {
							const action = game.teams[0].playoffs
								? {}
								: {
										actionDisabled: gameSimInProgress || i === 0,
										actionText: (
											<>
												Sim to
												<br />
												game
											</>
										),
										actionOnClick: () => {
											toWorker("actions", "simToGame", game.gid);
										},
								  };

							const allowTie = allowForceTie({
								homeTid: game.teams[0].tid,
								awayTid: game.teams[1].tid,
								elam,
								elamASG,
								phase,
								ties,
							});

							return (
								<Fragment key={game.gid}>
									<ScoreBox
										game={{
											// Leave out forceTie, since ScoreBox wants the value for finished games
											gid: game.gid,
											season: game.season,
											teams: game.teams,
										}}
										header={i === 0}
										{...action}
									/>
									<ForceWin
										key={forceWinKey}
										allowTie={allowTie}
										className="mb-3"
										game={game}
									/>
								</Fragment>
							);
						})}
					</ul>
				</div>
				<div className="col-sm-6">
					<h2>Completed Games</h2>
					{completed.map((game, i) => (
						<ScoreBox
							className="mb-3"
							key={game.gid}
							game={game}
							header={i === 0}
						/>
					))}
				</div>
			</div>
		</>
	);
};

Schedule.propTypes = {
	abbrev: PropTypes.string.isRequired,
	completed: PropTypes.arrayOf(PropTypes.object).isRequired,
	upcoming: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Schedule;
