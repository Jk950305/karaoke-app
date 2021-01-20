const classNames = require('classnames');
const React = require('react');

const FilenameLabel = props => {
    if (props.filename === undefined || props.filename === "") {
        return null;
    }

    const classes = ['alert', 'filename-label'];
    if (props.error === undefined) {
        classes.push('alert-info');
    } else {
        classes.push('alert-danger');
    }

    var title = props.filename;
    title = (title.charAt(title.length-4) === ".")?(title.substring(0, title.indexOf('.'))):(title);
    return <span className={classNames(classes)}>{title}</span>;
};


export default FilenameLabel;
