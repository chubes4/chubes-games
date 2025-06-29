import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function Edit() {
	const blockProps = useBlockProps();
	const [ scores, setScores ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		const fetchScores = async () => {
			try {
				setIsLoading( true );
				const fetchedScores = await apiFetch( { path: '/chubes-games/v1/scores' } );
				setScores( fetchedScores );
				setError( null );
			} catch ( e ) {
				setError( 'Failed to load scores.' );
				console.error( e );
			} finally {
				setIsLoading( false );
			}
		};

		fetchScores();
	}, [] );

	return (
		<div { ...blockProps }>
			<h4>{ __( 'Leaderboard', 'chubes-games' ) }</h4>
			{ isLoading && <p>{ __( 'Loading...', 'chubes-games' ) }</p> }
			{ error && <p>{ error }</p> }
			{ ! isLoading && ! error && (
				<table>
					<thead>
						<tr>
							<th>{ __( 'Rank', 'chubes-games' ) }</th>
							<th>{ __( 'Player', 'chubes-games' ) }</th>
							<th>{ __( 'Score', 'chubes-games' ) }</th>
							<th>{ __( 'Date', 'chubes-games' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ scores.length === 0 ? (
							<tr>
								<td colSpan="4">{ __( 'No scores yet!', 'chubes-games' ) }</td>
							</tr>
						) : (
							scores.map( ( score, index ) => (
								<tr key={ score.id }>
									<td>{ index + 1 }</td>
									<td>{ score.player_name }</td>
									<td>{ score.player_score }</td>
									<td>{ new Date( score.date_recorded ).toLocaleDateString() }</td>
								</tr>
							) )
						) }
					</tbody>
				</table>
			) }
		</div>
	);
} 