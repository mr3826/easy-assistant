import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock } from 'lucide-react';

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export default function AvailabilityPage() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1>Availability Settings</h1>
        <p className="text-gray-500">Configure your business hours and booking availability</p>
      </div>
      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>Set your operating hours for each day of the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weekDays.map((day) => (
            <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <Checkbox id={day} defaultChecked={day !== 'Sunday'} />
              <Label htmlFor={day} className="flex-1 font-medium">{day}</Label>
              <Input type="time" defaultValue="09:00" className="w-32 bg-white" />
              <span className="text-gray-500">to</span>
              <Input type="time" defaultValue="17:00" className="w-32 bg-white" />
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setActionStatus('Weekday hours copied locally for this demo.')}
            >
              Apply to All Days
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setActionStatus('Availability changes saved locally for this demo.')}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
