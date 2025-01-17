import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@patternfly/react-core/dist/esm/components/Button";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState";
import { FormFieldGroup, FormFieldGroupHeader } from "@patternfly/react-core/dist/esm/components/Form";
import { HelperText, HelperTextItem } from "@patternfly/react-core/dist/esm/components/HelperText";

import './DynamicListForm.scss';

/* Dynamic list with a variable number of rows. Each row is a custom component, usually an input field(s).
 *
 * Props:
 *   - emptyStateString
 *   - onChange
 *   - id
 *   - itemcomponent
 *   - formclass (optional)
 *   - options (optional)
 *   - onValidationChange: A handler function which updates the parent's component's validation object.
 *                         Its parameter is an array the same structure as 'validationFailed'.
 *   - validationFailed: An array where each item represents a validation error of the corresponding row component index.
 *                       A row is strictly mapped to an item of the array by its index.
 *     Example: Let's have a dynamic form, where each row consists of 2 fields: name and email. Then a validation array of
 *              these rows would look like this:
 *     [
 *       { name: "Name must not be empty }, // first row
 *       { }, // second row
 *       { name: "Name cannot containt number", email: "Email must contain '@'" } // third row
 *     ]
 */
export class DynamicListForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            list: [],
        };
        this.keyCounter = 0;
        this.removeItem = this.removeItem.bind(this);
        this.addItem = this.addItem.bind(this);
        this.onItemChange = this.onItemChange.bind(this);
    }

    removeItem(idx) {
        this.setState(state => {
            const validationFailedDelta = this.props.validationFailed ? [...this.props.validationFailed] : [];
            // We also need to remove any error messages which the item (row) may have contained
            validationFailedDelta.splice(idx, 1);
            this.props.onValidationChange?.(validationFailedDelta);

            const items = state.list.concat();
            items.splice(idx, 1);

            return { list: items };
        }, () => this.props.onChange(this.state.list.concat()));
    }

    addItem() {
        this.setState(state => {
            return { list: [...state.list, Object.assign({ key: this.keyCounter++ }, this.props.default)] };
        }, () => this.props.onChange(this.state.list.concat()));
    }

    onItemChange(idx, field, value) {
        this.setState(state => {
            const items = state.list.concat();
            items[idx][field] = value || null;
            return { list: items };
        }, () => this.props.onChange(this.state.list.concat()));
    }

    render () {
        const { id, label, actionLabel, formclass, emptyStateString, helperText, validationFailed, onValidationChange } = this.props;
        const dialogValues = this.state;
        return (
            <FormFieldGroup header={
                <FormFieldGroupHeader
                    titleText={{ text: label }}
                    actions={<Button variant="secondary" className="btn-add" onClick={this.addItem}>{actionLabel}</Button>}
                />
            } className={"dynamic-form-group " + formclass}>
                {
                    dialogValues.list.length
                        ? <>
                            {dialogValues.list.map((item, idx) => {
                                return React.cloneElement(this.props.itemcomponent, {
                                    idx,
                                    item,
                                    id: id + "-" + idx,
                                    key: idx,
                                    onChange: this.onItemChange,
                                    removeitem: this.removeItem,
                                    additem: this.addItem,
                                    options: this.props.options,
                                    itemCount: Object.keys(dialogValues.list).length,
                                    validationFailed: validationFailed && validationFailed[idx],
                                    onValidationChange: value => {
                                        // Dynamic list consists of multiple rows. Therefore validationFailed object is presented as an array where each item represents a row
                                        // Each row/item then consists of key-value pairs, which represent a field name and it's validation error
                                        const delta = validationFailed ? [...validationFailed] : [];
                                        // Update validation of only a single row
                                        delta[idx] = value;

                                        // If a row doesn't contain any fields with errors anymore, we delete the item of the array
                                        // Deleting an item of an array replaces an item with an "empty item".
                                        // This guarantees that an array of validation errors maps to the correct rows
                                        if (Object.keys(delta[idx]).length == 0)
                                            delete delta[idx];

                                        onValidationChange?.(delta);
                                    },
                                });
                            })
                            }
                            {helperText &&
                            <HelperText>
                                <HelperTextItem>{helperText}</HelperTextItem>
                            </HelperText>
                            }
                        </>
                        : <EmptyState>
                            <EmptyStateBody>
                                {emptyStateString}
                            </EmptyStateBody>
                        </EmptyState>
                }
            </FormFieldGroup>
        );
    }
}

DynamicListForm.propTypes = {
    emptyStateString: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    itemcomponent: PropTypes.object.isRequired,
    formclass: PropTypes.string,
    options: PropTypes.object,
    validationFailed: PropTypes.array,
    onValidationChange: PropTypes.func,
};
