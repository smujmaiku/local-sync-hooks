import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react'
import { useSyncState } from './sync'

interface InputProps {
	name: string;
	initialValue: string;
}

function Input(props: InputProps): JSX.Element {
	const [value, setValue] = useSyncState<string>(props.name, props.initialValue)

	return (<div>
		<input
			value={value}
			onChange={({ target }) => { setValue(target.value) }}
		/>
	</div>)
}

export default {
	title: 'Docs/Sync',
	component: Input,
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = (args) => (
	<section>
		<p>
			<a href="#" target="_blank">Duplicate this window</a>
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
