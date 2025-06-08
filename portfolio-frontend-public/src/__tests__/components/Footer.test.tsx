import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../setup/test-utils';
import Footer from '../../components/Footer';

describe('Footer', () => {
    it('renders the footer with current year', () => {
        render(<Footer />);

        // Check if the DevOps text is present
        expect(screen.getByText('Tomer')).toBeInTheDocument();
        expect(screen.getByText('Edelsberg')).toBeInTheDocument();

        // Check if the current year is displayed
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(`© ${currentYear} Tomer Edelsberg. All rights reserved.`)).toBeInTheDocument();
    });
}); 