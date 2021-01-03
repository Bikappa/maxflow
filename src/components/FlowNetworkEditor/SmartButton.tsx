import { Button } from "@material-ui/core";
import { memo } from "react";


export const SmartButton = memo((props: React.ComponentProps<typeof Button>) => {
    const {onClick, disabled, ...otherProps} = props
    return <Button
        variant='contained'
        onClick={props.onClick}
        disabled={!props.onClick}
        {...otherProps}
        >
        {props.children}
    </Button>
})