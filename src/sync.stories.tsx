/* eslint-disable import/no-extraneous-dependencies */
import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';
import { useSyncState } from './sync';

interface InputProps {
	name: string;
	initialValue: string;
}

function Input(props: InputProps): JSX.Element {
	const { name, initialValue } = props;

	const [value, setValue, ready] = useSyncState<string>(name, initialValue);

	return (
		<div>
			<input
				disabled={!ready}
				value={ready ? value : '...'}
				onChange={({ target }) => {
					setValue(target.value);
				}}
			/>
		</div>
	);
}

export default {
	title: 'Docs/Sync',
	component: Input,
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = (args) => (
	<section>
		<p>
			<a href="#another" target="_blank">
				Duplicate this window
			</a>
			{' to see each input synchronized'}
		</p>
		<Input {...args} />
		<hr />
		<Input {...args} />
	</section>
);

export const Example = Template.bind({});

Example.args = {
	name: 'input',
	initialValue: 'Default',
};
