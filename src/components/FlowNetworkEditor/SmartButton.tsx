import { Button } from "@material-ui/core";


export function SmartButton(props: React.ComponentProps<typeof Button>) {
    const {onClick, disabled, ...otherProps} = props
    return <Button
        variant='contained'
        onClick={props.onClick}
        disabled={!props.onClick}
        {...otherProps}
        >
        {props.children}
    </Button>
}