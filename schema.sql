-- Create the polls table
CREATE TABLE polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the votes table
CREATE TABLE votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_option text NOT NULL
);

-- Enable Row Level Security for the tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for the polls table
CREATE POLICY "Allow all to read polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create polls" ON polls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow creator to update polls" ON polls FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Allow creator to delete polls" ON polls FOR DELETE USING (auth.uid() = creator_id);

-- Create policies for the votes table
CREATE POLICY "Allow all to read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow user to update their own vote" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow user to delete their own vote" ON votes FOR DELETE USING (auth.uid() = user_id);
