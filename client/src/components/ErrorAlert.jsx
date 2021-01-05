const React = require('react');

const ErrorAlert = props => {
    if (props.error === undefined) {
        return null;
    }

    return (
        <div className="alert alert-danger">
            <b>{props.error.type}:</b> {props.error.message}
        </div>
    );
};

export default ErrorAlert;
