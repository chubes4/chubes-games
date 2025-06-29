import { forwardRef } from '@wordpress/element';

const GameWindow = forwardRef((props, ref) => {
    const { className, ...otherProps } = props;
    const combinedClassName = className 
        ? `chubes-game-window ${className}`
        : 'chubes-game-window';
        
    return (
        <div { ...otherProps } className={combinedClassName} ref={ref}>
            { props.children }
        </div>
    );
});

export default GameWindow; 