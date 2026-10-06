/**
 * Entry point – immediately redirects to the student list screen.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/student/list" />;
}
